import { createLogger } from "@/lib/logger";
import { getRequestContext, type RequestContextStore, runWithSystemContext } from "./request-context";

const logger = createLogger({ module: "post-response" });

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
      logger.error({ err: error, label }, "Post-response task failed");
    });
  }, 0);
}
