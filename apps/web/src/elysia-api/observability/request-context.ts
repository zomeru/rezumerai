import { AsyncLocalStorage } from "node:async_hooks";

export type RequestContextSource = "API_REQUEST" | "BACKGROUND_JOB";

export interface RequestContextStore {
  requestId: string;
  source: RequestContextSource;
  startedAt: number;
  endpoint: string | null;
  method: string | null;
  userId: string | null;
  userRole: string | null;
  metadata: Record<string, unknown>;
}

const requestContextStorage = new AsyncLocalStorage<RequestContextStore>();

export function enterRequestContext(store: RequestContextStore): RequestContextStore {
  requestContextStorage.enterWith(store);
  return store;
}

export function getRequestContext(): RequestContextStore | undefined {
  return requestContextStorage.getStore();
}

export function updateRequestContext(patch: Partial<RequestContextStore>): void {
  const current = requestContextStorage.getStore();

  if (!current) {
    return;
  }

  Object.assign(current, patch);
}

export function mergeRequestContextMetadata(metadata: Record<string, unknown>): void {
  const current = requestContextStorage.getStore();

  if (!current) {
    return;
  }

  current.metadata = {
    ...current.metadata,
    ...metadata,
  };
}

export async function runWithSystemContext<T>(
  input: Omit<RequestContextStore, "startedAt"> & { startedAt?: number },
  callback: () => Promise<T>,
): Promise<T> {
  return requestContextStorage.run(
    {
      ...input,
      startedAt: input.startedAt ?? performance.now(),
    },
    callback,
  );
}
