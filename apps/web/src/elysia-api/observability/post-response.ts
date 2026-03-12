import { getRequestContext, type RequestContextStore, runWithSystemContext } from "./request-context";

type PostResponseTask = () => Promise<void> | void;

function cloneRequestContext(context: RequestContextStore | undefined): RequestContextStore | null {
  if (!context) {
    return null;
  }

  return {
    ...context,
    metadata: {
      ...context.metadata,
    },
  };
}

export function runPostResponseTask(task: PostResponseTask, label: string): void {
  const requestContext = cloneRequestContext(getRequestContext());

  globalThis.setTimeout(() => {
    const runTask = async () => {
      if (requestContext) {
        await runWithSystemContext(requestContext, async () => {
          await task();
        });
        return;
      }

      await task();
    };

    void runTask().catch((error: unknown) => {
      const message = error instanceof Error ? error.message : "Unknown post-response error";
      console.error(`[POST_RESPONSE:${label}] ${message}`);
    });
  }, 0);
}
