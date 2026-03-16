import { checkBotId } from "botid/server";
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { elysiaApp, initializeAppJobQueue } from "@/elysia-api/app";

const isBotIdEnabled = process.env.NODE_ENV !== "development";

// Initialize job queue once when module is first loaded
// This ensures jobs can be published from request handlers
let jobQueueInitialized = false;
let jobQueueInitializing = false;
const initializeJobQueueOnce = async () => {
  if (jobQueueInitialized || jobQueueInitializing) {
    return;
  }
  jobQueueInitializing = true;

  // Initialize in background - don't block requests
  initializeAppJobQueue()
    .then(() => {
      jobQueueInitialized = true;
    })
    .catch((error) => {
      console.warn("[API] Job queue initialization failed, will use inline processing:", error);
      jobQueueInitialized = true; // Mark as done to prevent retry
    });
};

// Trigger initialization (non-blocking, fire-and-forget)
void initializeJobQueueOnce();

async function withBotId(request: Request) {
  // Don't wait for job queue - it initializes in background
  // Requests proceed regardless of queue state

  if (!isBotIdEnabled) {
    return elysiaApp.fetch(request);
  }

  const verification = await checkBotId();

  if (verification.isBot) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Forward to Elysia
  return elysiaApp.fetch(request);
}

export const GET = withBotId;
export const POST = withBotId;
export const PUT = withBotId;
export const PATCH = withBotId;
export const DELETE = withBotId;
