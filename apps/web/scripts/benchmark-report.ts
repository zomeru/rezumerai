import { prisma } from "@rezumerai/database";
import { AdminService } from "../src/elysia-api/modules/admin/service";

function parseTimeframeDays(argv: string[]): number {
  const flag = argv.find((value) => value.startsWith("--days="));
  const rawValue = flag ? flag.split("=")[1] : argv[2];
  const parsed = Number(rawValue ?? "7");

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 7;
  }

  return Math.min(30, Math.floor(parsed));
}

function shouldPrintJson(argv: string[]): boolean {
  return argv.includes("--json");
}

function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

function formatDuration(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} s`;
  }

  return `${value.toFixed(2)} ms`;
}

async function main(): Promise<void> {
  const timeframeDays = parseTimeframeDays(process.argv);
  const jsonOutput = shouldPrintJson(process.argv);

  await prisma.$connect();

  try {
    const dashboard = await AdminService.getAnalyticsDashboard(prisma, timeframeDays);

    if (jsonOutput) {
      console.info(JSON.stringify(dashboard, null, 2));
      return;
    }

    const lines = [
      `Performance Report (${dashboard.timeframeDays} day${dashboard.timeframeDays === 1 ? "" : "s"})`,
      "",
      `Requests: ${formatNumber(dashboard.summary.totalRequests)}`,
      `Errors: ${formatNumber(dashboard.summary.totalErrors)} (${dashboard.summary.errorRate.toFixed(2)}%)`,
      `Avg response time: ${formatDuration(dashboard.summary.averageResponseTimeMs)}`,
      `Avg DB queries/request: ${dashboard.database.averageDbQueryCount.toFixed(2)}`,
      `Avg DB time/request: ${formatDuration(dashboard.database.averageDbQueryDurationMs)}`,
      `Slow-query requests: ${formatNumber(dashboard.database.slowQueryRequestCount)} (${dashboard.database.slowQueryRequestRate.toFixed(2)}%)`,
      "",
      "Top Endpoints",
      ...dashboard.endpointUsage
        .slice(0, 5)
        .map((endpoint) =>
          [
            `- ${endpoint.method} ${endpoint.endpoint}`,
            `${formatNumber(endpoint.requestCount)} req`,
            `${formatDuration(endpoint.averageResponseTimeMs)} resp`,
            `${endpoint.averageDbQueryCount.toFixed(2)} db queries`,
            `${formatDuration(endpoint.averageDbQueryDurationMs)} db time`,
            `${formatNumber(endpoint.slowQueryRequestCount)} slow-query req`,
          ].join(" | "),
        ),
      "",
      "Slow Query Patterns",
      ...(dashboard.slowQueryPatterns.length > 0
        ? dashboard.slowQueryPatterns.map((pattern) =>
            [
              `- ${pattern.model} ${pattern.operation}`,
              `${formatNumber(pattern.occurrenceCount)} samples`,
              `avg ${formatDuration(pattern.averageDurationMs)}`,
              `max ${formatDuration(pattern.maxDurationMs)}`,
            ].join(" | "),
          )
        : ["- No slow query patterns captured in the selected window."]),
    ];

    console.info(lines.join("\n"));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "unknown error";
  console.error(`[benchmark:report] failed: ${message}`);
  process.exitCode = 1;
});
