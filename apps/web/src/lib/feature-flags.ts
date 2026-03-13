import { type PrismaClient, prisma } from "@rezumerai/database";

type DatabaseClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$extends" | "$on" | "$transaction">;
type CachedFeatureFlagValue = {
  enabled: boolean;
  rolloutPercentage: number;
} | null;

const FEATURE_FLAG_CACHE_TTL_MS = 60_000;
const featureFlagCache = new Map<
  string,
  {
    expiresAt: number;
    value: CachedFeatureFlagValue;
  }
>();

function isMissingFeatureFlagTableError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    error.code === "P2021"
  );
}

function shouldUseFeatureFlagCache(db: DatabaseClient): boolean {
  return db === prisma;
}

function computeRolloutBucket(name: string, subjectKey: string): number {
  const input = `${name}:${subjectKey}`;
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash % 100);
}

export function clearFeatureFlagCache(name?: string): void {
  if (!name) {
    featureFlagCache.clear();
    return;
  }

  featureFlagCache.delete(name);
}

async function readFeatureFlag(
  db: DatabaseClient,
  name: string,
): Promise<{
  enabled: boolean;
  rolloutPercentage: number;
} | null> {
  const useCache = shouldUseFeatureFlagCache(db);

  if (useCache) {
    const cached = featureFlagCache.get(name);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
  }

  let featureFlag: {
    enabled: boolean;
    rolloutPercentage: number;
  } | null = null;

  try {
    featureFlag = await db.featureFlag.findUnique({
      where: { name },
      select: {
        enabled: true,
        rolloutPercentage: true,
      },
    });
  } catch (error: unknown) {
    if (!isMissingFeatureFlagTableError(error)) {
      throw error;
    }
  }

  if (useCache) {
    featureFlagCache.set(name, {
      value: featureFlag,
      expiresAt: Date.now() + FEATURE_FLAG_CACHE_TTL_MS,
    });
  }

  return featureFlag;
}

export async function isFeatureEnabled(
  name: string,
  options?: {
    db?: DatabaseClient;
    subjectKey?: string | null;
  },
): Promise<boolean> {
  const db = options?.db ?? prisma;
  const featureFlag = await readFeatureFlag(db, name);

  if (!featureFlag?.enabled) {
    return false;
  }

  if (featureFlag.rolloutPercentage >= 100) {
    return true;
  }

  if (featureFlag.rolloutPercentage <= 0) {
    return false;
  }

  if (!options?.subjectKey) {
    return false;
  }

  return computeRolloutBucket(name, options.subjectKey) < featureFlag.rolloutPercentage;
}
