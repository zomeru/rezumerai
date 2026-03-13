export type FeatureFlagEvaluationValue = {
  enabled: boolean;
  rolloutPercentage: number;
} | null;

export function computeRolloutBucket(name: string, subjectKey: string): number {
  const input = `${name}:${subjectKey}`;
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash % 100);
}

export function evaluateFeatureFlag(
  name: string,
  featureFlag: FeatureFlagEvaluationValue,
  options?: {
    subjectKey?: string | null;
  },
): boolean {
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
