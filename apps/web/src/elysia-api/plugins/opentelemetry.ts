import { opentelemetry } from "@elysiajs/opentelemetry";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { serverEnv } from "@/env";

/**
 * OpenTelemetry plugin for Elysia.
 *
 * In development, spans are created but not exported (no exporter configured).
 * In production, spans are exported via OTLP to the configured endpoint
 * (e.g. Jaeger, Zipkin, Axiom, New Relic, etc.).
 *
 * Set these env vars to enable production export:
 *   OTEL_EXPORTER_OTLP_ENDPOINT — OTLP collector endpoint
 *   OTEL_EXPORTER_OTLP_HEADERS  — comma-separated key=value auth headers
 *
 * @see https://elysiajs.com/patterns/opentelemetry.html
 */
function buildSpanProcessors(): BatchSpanProcessor[] {
  const endpoint = serverEnv?.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return [];

  const rawHeaders = serverEnv?.OTEL_EXPORTER_OTLP_HEADERS ?? "";
  const headers: Record<string, string> = Object.fromEntries(
    rawHeaders
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean)
      .map((h): [string, string] => {
        const idx = h.indexOf("=");
        return [h.slice(0, idx).trim(), h.slice(idx + 1).trim()];
      }),
  );

  return [new BatchSpanProcessor(new OTLPTraceExporter({ url: endpoint, headers }))];
}

export const opentelemetryPlugin = opentelemetry({
  spanProcessors: buildSpanProcessors(),
});
