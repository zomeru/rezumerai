import { checkBotId } from "botid/server";
import { NextResponse } from "next/dist/server/web/spec-extension/response";
import {
  elysiaApp,
  initializeAiCircuitBreaker,
  initializeAppJobQueue,
  initializeGracefulShutdown,
} from "@/elysia-api/app";

// BotId requires the x-vercel-oidc-token header injected by Vercel's edge
// infrastructure. Gate on VERCEL=1 so Docker/self-hosted deployments are not
// blocked by a Vercel-specific check that can never pass outside Vercel.
const isBotIdEnabled = process.env.NODE_ENV !== "development" && process.env.VERCEL === "1";

// Initialize graceful shutdown handlers once when module is first loaded
let shutdownInitialized = false;
let shutdownInitializing = false;
const initializeShutdownOnce = () => {
  if (shutdownInitialized || shutdownInitializing) {
    return;
  }
  shutdownInitializing = true;
  initializeGracefulShutdown();
  shutdownInitialized = true;
};

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

// Initialize AI circuit breaker once when module is first loaded
let circuitBreakerInitialized = false;
let circuitBreakerInitializing = false;
const initializeCircuitBreakerOnce = async () => {
  if (circuitBreakerInitialized || circuitBreakerInitializing) {
    return;
  }
  circuitBreakerInitializing = true;

  // Initialize in background - don't block requests
  initializeAiCircuitBreaker()
    .then(() => {
      circuitBreakerInitialized = true;
    })
    .catch((error) => {
      console.warn("[API] AI circuit breaker initialization failed, will use defaults:", error);
      circuitBreakerInitialized = true; // Mark as done to prevent retry
    });
};

// Trigger initializations (non-blocking, fire-and-forget)
initializeShutdownOnce();
void initializeJobQueueOnce();
void initializeCircuitBreakerOnce();

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
