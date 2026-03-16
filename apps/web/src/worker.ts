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
import { logger } from "@/lib/logger";
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
    logger.warn({ signal }, "Worker already shutting down, forcing exit");
    process.exit(1);
  }

  isShuttingDown = true;
  logger.info({ signal }, "Initiating graceful shutdown");

  try {
    // Close database connections
    await prisma.$disconnect();
    logger.info("Database connections closed");

    // Shutdown job queue
    await shutdownJobQueue();
    logger.info("Job queue stopped");

    logger.info("Graceful shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "Error during shutdown");
    process.exit(1);
  }
}

// Register signal handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Main entry point
async function main(): Promise<void> {
  logger.info(
    {
      nodeVersion: process.version,
      environment: process.env.NODE_ENV ?? "development",
    },
    "Starting background job worker",
  );

  const { jobs } = parseArgs();

  try {
    // Initialize the job queue
    logger.info("Initializing job queue");
    await initializeJobQueue();
    logger.info("Job queue initialized");

    // Register workers
    if (jobs && jobs.length > 0) {
      logger.info({ jobs }, "Registering specific workers");
      await registerWorkers(jobs);
    } else {
      logger.info("Registering all workers");
      await registerAllWorkers();
    }

    logger.info("Worker process started successfully");
    logger.info("Waiting for jobs");

    // Keep the process alive
    // pg-boss handles the job polling internally
  } catch (error) {
    logger.error({ err: error }, "Failed to start worker");
    await gracefulShutdown("ERROR");
  }
}

// Start the worker
main().catch((error) => {
  logger.fatal({ err: error }, "Unhandled worker error");
  process.exit(1);
});
