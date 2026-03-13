"use client";

import AnalyticsDashboardPageClient from "./AnalyticsDashboardPageClient";

// This component is intentionally isolated so the interactive charts rollout
// can replace the legacy analytics UI without touching the flag wiring.
export default function AnalyticsDashboardInteractivePageClient(): React.JSX.Element {
  return <AnalyticsDashboardPageClient />;
}
