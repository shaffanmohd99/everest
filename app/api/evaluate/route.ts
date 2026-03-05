import { NextResponse } from "next/server";
import { z } from "zod";
import { FeatureFlag, type FeatureFlagDoc } from "@/lib/models/FeatureFlag";
import { Override, type OverrideDoc } from "@/lib/models/Override";
import { evaluateFeature } from "@/lib/flag-engine";
import { jsonError } from "@/lib/api-utils";
import { getCachedFlag, getCachedOverrides } from "@/lib/cache/flag-cache";
import { withDb } from "@/lib/with-db";

export const runtime = "nodejs";

const evaluateSchema = z.object({
  key: z.string().min(1).max(64).trim(),
  userId: z.string().min(1).max(128).optional(),
  groupId: z.string().min(1).max(128).optional(),
  region: z.string().min(1).max(64).optional(),
});

export async function POST(request: Request) {
  return withDb(async () => {
    const body = await request.json().catch(() => null);
    const parsed = evaluateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid payload", 400, z.treeifyError(parsed.error));
    }

    const { key, userId, groupId, region } = parsed.data;

    const flag = await getCachedFlag(key, () =>
      FeatureFlag.findOne({ key }).lean<FeatureFlagDoc | null>().exec()
    );
    if (!flag) {
      return jsonError("Feature flag not found", 404);
    }

    const overrides = await getCachedOverrides(key, () =>
      Override.find({ featureKey: key }).lean<OverrideDoc[]>().exec()
    );
    const result = evaluateFeature(flag, overrides, { userId, groupId, region });

    return NextResponse.json({
      key,
      enabled: result.enabled,
      reason: result.reason,
      matchedOverride: result.matchedOverride,
    });
  });
}
