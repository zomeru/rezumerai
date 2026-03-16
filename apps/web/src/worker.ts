/**
 * Background Job Worker Process
 *
 * This is the entry point for the standalone worker process that processes
 * background jobs from the pg-boss queue.
 *
 * Usage:
 *   bun run worker.ts                    # Start all workers
 *   bun run worker.ts --jobs=embeddings  # Start only embedding workers
 *
 * Environment variables required:
 *   DATABASE_URL - PostgreSQL connection string
 *   OPENROUTER_API_KEY - For AI embedding generation
 *   EMBEDDING_PROVIDER - Embedding provider name
 *   EMBEDDING_MODEL - Embedding model name
 *   EMBEDDING_DIMENSIONS - Embedding dimensions
 */

import { prisma } from "@rezumerai/database";
import { initializeJobQueue, type JobName, shutdownJobQueue } from "./elysia-api/modules/jobs/queue";
import { registerAllWorkers, registerWorkers } from "./elysia-api/modules/jobs/worker";

// Parse command line arguments
function parseArgs(): { jobs?: JobName[] } {
  const args = process.argv.slice(2);
  const jobsArg = args.find((arg) => arg.startsWith("--jobs="));

  if (!jobsArg) {
    return {};
  }

  const jobNames = jobsArg
    .slice(7)
    .split(",")
    .map((j) => j.trim() as JobName);
  return { jobs: jobNames };
}

// Graceful shutdown handling
let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    console.log(`[WORKER] Already shutting down, forcing exit...`);
    process.exit(1);
  }

  isShuttingDown = true;
  console.log(`[WORKER] Received ${signal}, initiating graceful shutdown...`);

  try {
    // Close database connections
    await prisma.$disconnect();
    console.log("[WORKER] Database connections closed");

    // Shutdown job queue
    await shutdownJobQueue();
    console.log("[WORKER] Job queue stopped");

    console.log("[WORKER] Graceful shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("[WORKER] Error during shutdown:", error);
    process.exit(1);
  }
}

// Register signal handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Main entry point
async function main(): Promise<void> {
  console.log("[WORKER] Starting background job worker...");
  console.log(`[WORKER] Node version: ${process.version}`);
  console.log(`[WORKER] Environment: ${process.env.NODE_ENV ?? "development"}`);

  const { jobs } = parseArgs();

  try {
    // Initialize the job queue
    console.log("[WORKER] Initializing job queue...");
    await initializeJobQueue();
    console.log("[WORKER] Job queue initialized");

    // Register workers
    if (jobs && jobs.length > 0) {
      console.log(`[WORKER] Registering specific workers: ${jobs.join(", ")}`);
      await registerWorkers(jobs);
    } else {
      console.log("[WORKER] Registering all workers");
      await registerAllWorkers();
    }

    console.log("[WORKER] Worker process started successfully");
    console.log("[WORKER] Waiting for jobs...");

    // Keep the process alive
    // pg-boss handles the job polling internally
  } catch (error) {
    console.error("[WORKER] Failed to start worker:", error);
    await gracefulShutdown("ERROR");
  }
}

// Start the worker
main().catch((error) => {
  console.error("[WORKER] Unhandled error:", error);
  process.exit(1);
});
