import { NextResponse } from "next/server";
import { z } from "zod";
import { FeatureFlag } from "@/lib/models/FeatureFlag";
import { jsonError, isDuplicateKeyError } from "@/lib/api-utils";
import { withDb } from "@/lib/with-db";

export const runtime = "nodejs";

const createFlagSchema = z.object({
  key: z.string().min(1).max(64).trim(),
  defaultState: z.boolean(),
  description: z.string().max(500).optional().default(""),
});

export async function GET() {
  return withDb(async () => {
    const flags = await FeatureFlag.find().sort({ key: 1 }).lean();
    return NextResponse.json({ flags });
  });
}

export async function POST(request: Request) {
  return withDb(async () => {
    const body = await request.json().catch(() => null);
    const parsed = createFlagSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid payload", 400, z.treeifyError(parsed.error));
  }

    try {
      const flag = await FeatureFlag.create(parsed.data);
      return NextResponse.json({ flag }, { status: 201 });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return jsonError("Feature key already exists", 409);
      }
      return jsonError("Failed to create feature flag", 500);
    }
  });
}
