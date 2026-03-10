import { brotliCompressSync, constants as zlibConstants } from "node:zlib";
import Elysia, { ElysiaCustomStatusResponse } from "elysia";

// ─── Types ────────────────────────────────────────────────────────────────────

type CompressionEncoding = "br" | "gzip" | "deflate";

interface CompressPluginOptions {
  /**
   * Minimum response size in bytes before compression kicks in.
   * Responses smaller than this are sent uncompressed.
   * @default 1024
   */
  threshold?: number;

  /**
   * Encoding priority from most to least preferred.
   * The first encoding that the client supports will be used.
   * @default ["br", "gzip", "deflate"]
   */
  encodings?: CompressionEncoding[];

  /**
   * Brotli compression quality (0-11). Higher = smaller but slower.
   * @default 4
   */
  brotliQuality?: number;

  /**
   * Gzip compression level (1-9). Higher = smaller but slower.
   * @default 6
   */
  gzipLevel?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

  // Elysia plugin scope (global, local, or scoped). Defaults to global.
  as?: "global" | "local" | "scoped";
}

// ─── Content-type checks ──────────────────────────────────────────────────────

/** Content types that are already compressed or not worth compressing. */
const SKIP_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/svg+xml",
  "application/zip",
  "application/gzip",
  "application/x-brotli",
  "application/octet-stream",
  "application/pdf",
  "video/",
  "audio/",
] as const;

function shouldSkipContentType(contentType: string | undefined): boolean {
  if (!contentType) return false;
  const lower = contentType.toLowerCase();
  return SKIP_CONTENT_TYPES.some((skip) => lower.startsWith(skip));
}

// ─── Compression helpers ──────────────────────────────────────────────────────

function compressBuffer(
  data: Uint8Array<ArrayBuffer>,
  encoding: CompressionEncoding,
  options: Required<Pick<CompressPluginOptions, "brotliQuality" | "gzipLevel">>,
): Uint8Array {
  switch (encoding) {
    case "br":
      return brotliCompressSync(data, {
        params: {
          [zlibConstants.BROTLI_PARAM_QUALITY]: options.brotliQuality,
        },
      });
    case "gzip":
      return Bun.gzipSync(data, { level: options.gzipLevel });
    case "deflate":
      return Bun.deflateSync(data);
  }
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return Uint8Array.from(data).buffer;
}

function negotiateEncoding(acceptEncoding: string, preferred: CompressionEncoding[]): CompressionEncoding | null {
  const lower = acceptEncoding.toLowerCase();
  for (const enc of preferred) {
    if (lower.includes(enc)) return enc;
  }
  return null;
}

// ─── Plugin ───────────────────────────────────────────────────────────────────

const encoder = new TextEncoder();

/**
 * Unwraps Elysia `status(code, value)` responses.
 *
 * When a handler returns `status(200, data)`, Elysia wraps it in an
 * `ElysiaCustomStatusResponse` instance with `.code` and `.response`.
 * The default Elysia response mapper knows how to unpack this, but a
 * custom `mapResponse` hook receives the raw instance. This helper
 * extracts the actual payload so the API returns the data directly
 * (e.g. `[…]` instead of `{ code: 200, response: […] }`).
 */
function unwrapElysiaResponse(
  responseValue: unknown,
  currentStatus: number | string | undefined,
): { value: unknown; status: number } {
  if (responseValue instanceof ElysiaCustomStatusResponse) {
    return {
      value: responseValue.response,
      status: typeof responseValue.code === "number" ? responseValue.code : Number(responseValue.code),
    };
  }
  return {
    value: responseValue,
    status: typeof currentStatus === "number" ? currentStatus : 200,
  };
}

/**
 * Elysia compression plugin using the `mapResponse` lifecycle hook.
 *
 * Compresses responses using Brotli, Gzip, or Deflate based on the
 * client's `Accept-Encoding` header. Uses `mapResponse` — the
 * Elysia-recommended hook for response transformation — so it works
 * seamlessly with Elysia embedded in Next.js API routes.
 *
 * It also unwraps Elysia's `status()` tagged responses so the API
 * returns the raw data (e.g. an array) instead of a wrapper object.
 *
 * @example
 * ```ts
 * const app = new Elysia()
 *   .use(compressPlugin())
 *   .get("/", () => ({ hello: "world" }));
 * ```
 */
export const compressPlugin = (options?: CompressPluginOptions): Elysia => {
  const threshold = options?.threshold ?? 1024;
  const encodings = options?.encodings ?? ["br", "gzip", "deflate"];
  const brotliQuality = options?.brotliQuality ?? 4;
  const gzipLevel = options?.gzipLevel ?? 6;

  return new Elysia({ name: "plugin/compress" }).mapResponse(
    { as: options?.as ?? "global" },
    ({ responseValue, request, set }) => {
      // ── 0. Unwrap Elysia status() tagged values ─────────────────────────
      const { value: actualValue, status: statusCode } = unwrapElysiaResponse(responseValue, set.status);

      // ── 1. Skip Response/stream/blob (already handled or not serializable)
      if (actualValue instanceof Response || actualValue instanceof ReadableStream || actualValue instanceof Blob) {
        return;
      }

      // ── 2. Serialize the unwrapped value to text ────────────────────────
      const isJson = typeof actualValue === "object" && actualValue !== null;
      const text = isJson ? JSON.stringify(actualValue) : (actualValue?.toString() ?? "");
      const raw = encoder.encode(text);

      // ── 3. Determine content type ───────────────────────────────────────
      const existingContentType = set.headers?.["Content-Type"] ?? set.headers?.["content-type"];
      const contentType =
        typeof existingContentType === "string"
          ? existingContentType
          : `${isJson ? "application/json" : "text/plain"}; charset=utf-8`;

      // ── 4. Check if client accepts compressed responses ─────────────────
      const acceptEncoding = request.headers.get("accept-encoding");
      const encoding = acceptEncoding ? negotiateEncoding(acceptEncoding, encodings) : null;

      // ── 5. Try to compress if above threshold and encoding is available ─
      if (encoding && raw.byteLength >= threshold) {
        if (!shouldSkipContentType(contentType)) {
          const compressed = compressBuffer(raw, encoding, {
            brotliQuality,
            gzipLevel,
          });

          // Only use compressed version if it's actually smaller
          if (compressed.byteLength < raw.byteLength) {
            set.headers["Content-Encoding"] = encoding;
            set.headers.Vary =
              typeof set.headers.Vary === "string"
                ? appendVary(set.headers.Vary, "Accept-Encoding")
                : "Accept-Encoding";

            return new Response(toArrayBuffer(compressed), {
              status: statusCode,
              headers: { "Content-Type": contentType },
            });
          }
        }
      }

      // ── 6. No compression — still return unwrapped response ─────────────
      return new Response(text, {
        status: statusCode,
        headers: { "Content-Type": contentType },
      });
    },
  );
};

// ─── Vary header helper ───────────────────────────────────────────────────────

function appendVary(existing: string | string[] | undefined, value: string): string {
  if (!existing) return value;
  const str = Array.isArray(existing) ? existing.join(", ") : existing;
  if (str.includes(value)) return str;
  return `${str}, ${value}`;
}
