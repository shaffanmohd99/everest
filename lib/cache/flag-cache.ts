import type { FeatureFlagDoc } from "@/lib/models/FeatureFlag";
import type { OverrideDoc } from "@/lib/models/Override";

const TTL_MS = 15000;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const flagCache = new Map<string, CacheEntry<FeatureFlagDoc>>();
const overrideCache = new Map<string, CacheEntry<OverrideDoc[]>>();

function isFresh<T>(entry?: CacheEntry<T>) {
  return entry && entry.expiresAt > Date.now();
}

export function getCachedFlag(
  key: string,
  fetcher: () => Promise<FeatureFlagDoc | null>
) {
  const cached = flagCache.get(key);
  if (isFresh(cached)) {
    return Promise.resolve(cached.value);
  }

  return fetcher().then((value) => {
    if (value) {
      flagCache.set(key, { value, expiresAt: Date.now() + TTL_MS });
    }
    return value;
  });
}

export function getCachedOverrides(
  key: string,
  fetcher: () => Promise<OverrideDoc[]>
) {
  const cached = overrideCache.get(key);
  if (isFresh(cached)) {
    return Promise.resolve(cached.value);
  }

  return fetcher().then((value) => {
    overrideCache.set(key, { value, expiresAt: Date.now() + TTL_MS });
    return value;
  });
}

export function invalidateFlagCache(key: string) {
  flagCache.delete(key);
}

export function invalidateOverrideCache(key: string) {
  overrideCache.delete(key);
}
