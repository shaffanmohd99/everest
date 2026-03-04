import type { FeatureFlagDoc } from "@/lib/models/FeatureFlag";
import type { OverrideDoc, OverrideType } from "@/lib/models/Override";

export type EvaluationContext = {
  userId?: string;
  groupId?: string;
  region?: string;
};

export type EvaluationResult = {
  enabled: boolean;
  reason: OverrideType | "default";
  matchedOverride?: OverrideDoc | null;
};

function findOverride(
  overrides: OverrideDoc[],
  type: OverrideType,
  target?: string
) {
  if (!target) return null;
  return overrides.find((override) => override.type === type && override.target === target) ?? null;
}

export function evaluateFeature(
  flag: FeatureFlagDoc,
  overrides: OverrideDoc[],
  context: EvaluationContext
): EvaluationResult {
  const userOverride = findOverride(overrides, "user", context.userId);
  if (userOverride) {
    return { enabled: userOverride.state, reason: "user", matchedOverride: userOverride };
  }

  const groupOverride = findOverride(overrides, "group", context.groupId);
  if (groupOverride) {
    return { enabled: groupOverride.state, reason: "group", matchedOverride: groupOverride };
  }

  const regionOverride = findOverride(overrides, "region", context.region);
  if (regionOverride) {
    return { enabled: regionOverride.state, reason: "region", matchedOverride: regionOverride };
  }

  return { enabled: flag.defaultState, reason: "default", matchedOverride: null };
}
