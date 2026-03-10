export type RouteHeaders = Record<string, string>;
export type StatusMap = Record<number, unknown>;

export type RouteResult<TCases extends StatusMap> = {
  [TStatus in keyof TCases & number]: {
    status: TStatus;
    body: TCases[TStatus];
    headers?: RouteHeaders;
  };
}[keyof TCases & number];
