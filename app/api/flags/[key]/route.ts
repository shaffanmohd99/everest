import { NextResponse } from "next/server";
import { z } from "zod";
import { FeatureFlag } from "@/lib/models/FeatureFlag";
import { Override } from "@/lib/models/Override";
import { jsonError, isDuplicateKeyError } from "@/lib/api-utils";
import {
  invalidateFlagCache,
  invalidateOverrideCache,
} from "@/lib/cache/flag-cache";
import { withDb } from "@/lib/with-db";

export const runtime = "nodejs";

const updateFlagSchema = z.object({
  defaultState: z.boolean().optional(),
  description: z.string().max(500).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const { key } = await params;
    return withDb(async () => {
      const flag = await FeatureFlag.findOne({ key }).lean();
      if (!flag) {
        return jsonError("Feature flag not found", 404);
      }

      const overrides = await Override.find({ featureKey: key })
        .sort({ type: 1 })
        .lean();
      return NextResponse.json({ flag, overrides });
    });
  } catch {
    return jsonError("Invalid route parameters", 400);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const { key } = await params;
    return withDb(async () => {
      const body = await request.json().catch(() => null);
      const parsed = updateFlagSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError("Invalid payload", 400, z.treeifyError(parsed.error));
      }

      try {
        const updated = await FeatureFlag.findOneAndUpdate({ key }, parsed.data, {
          new: true,
          runValidators: true,
        }).lean();

        if (!updated) {
          return jsonError("Feature flag not found", 404);
        }

        invalidateFlagCache(key);
        invalidateOverrideCache(key);

        return NextResponse.json({ flag: updated });
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          return jsonError("Feature key already exists", 409);
        }
        return jsonError("Failed to update feature flag", 500);
      }
    });
  } catch {
    return jsonError("Invalid route parameters", 400);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    const { key } = await params;
    return withDb(async () => {
      const flag = await FeatureFlag.findOneAndDelete({ key }).lean();
      if (!flag) {
        return jsonError("Feature flag not found", 404);
      }

      await Override.deleteMany({ featureKey: key });
      invalidateFlagCache(key);
      invalidateOverrideCache(key);

      return NextResponse.json({ deleted: true });
    });
  } catch {
    return jsonError("Invalid route parameters", 400);
  }
}
