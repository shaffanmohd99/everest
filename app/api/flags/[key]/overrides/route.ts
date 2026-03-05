import { NextResponse } from "next/server";
import { z } from "zod";
import { FeatureFlag } from "@/lib/models/FeatureFlag";
import { Override } from "@/lib/models/Override";
import { jsonError, isDuplicateKeyError } from "@/lib/api-utils";
import { invalidateOverrideCache } from "@/lib/cache/flag-cache";
import { withDb } from "@/lib/with-db";

export const runtime = "nodejs";

const createOverrideSchema = z.object({
  type: z.enum(["user", "group", "region"]),
  target: z.string().min(1).max(128).trim(),
  state: z.boolean(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;
    return withDb(async () => {
      const body = await request.json().catch(() => null);
      const parsed = createOverrideSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError("Invalid payload", 400, z.treeifyError(parsed.error));
      }

      const flag = await FeatureFlag.findOne({ key }).lean();
      if (!flag) {
        return jsonError("Feature flag not found", 404);
      }

      try {
        const override = await Override.create({
          featureKey: key,
          ...parsed.data,
        });

        invalidateOverrideCache(key);

        return NextResponse.json({ override }, { status: 201 });
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          return jsonError("Override already exists for target", 409);
        }
        return jsonError("Failed to create override", 500);
      }
    });
  } catch {
    return jsonError("Invalid route parameters", 400);
  }
}
