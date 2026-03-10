import type { RouteHeaders } from "../types";

export function routeResult<TStatus extends number, TBody>(
  status: TStatus,
  body: TBody,
  headers?: RouteHeaders,
): {
  status: TStatus;
  body: TBody;
  headers?: RouteHeaders;
} {
  return headers ? { status, body, headers } : { status, body };
}
