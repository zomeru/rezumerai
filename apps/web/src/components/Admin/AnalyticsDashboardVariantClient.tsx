"use client";

import { FEATURE_FLAG_NAMES } from "@rezumerai/types";
import { useFeatureFlags } from "@/hooks/useAdmin";
import { evaluateFeatureFlag } from "@/lib/feature-flags.shared";
import AnalyticsDashboardInteractivePageClient from "./AnalyticsDashboardInteractivePageClient";
import AnalyticsDashboardPageClient from "./AnalyticsDashboardPageClient";

export default function AnalyticsDashboardVariantClient({
  initialUseInteractiveAnalyticsUi,
  subjectKey,
}: {
  initialUseInteractiveAnalyticsUi: boolean;
  subjectKey?: string | null;
}): React.JSX.Element {
  const { data } = useFeatureFlags();
  const liveFeatureFlag = data?.items.find((item) => item.name === FEATURE_FLAG_NAMES.NEW_ADMIN_ANALYTICS_UI) ?? null;

  const useInteractiveAnalyticsUi = liveFeatureFlag
    ? evaluateFeatureFlag(
        FEATURE_FLAG_NAMES.NEW_ADMIN_ANALYTICS_UI,
        {
          enabled: liveFeatureFlag.enabled,
          rolloutPercentage: liveFeatureFlag.rolloutPercentage,
        },
        {
          subjectKey,
        },
      )
    : initialUseInteractiveAnalyticsUi;

  return useInteractiveAnalyticsUi ? <AnalyticsDashboardInteractivePageClient /> : <AnalyticsDashboardPageClient />;
}
