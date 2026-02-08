import { app } from "./app";
import { env } from "./env";

/**
 * Start the Elysia server using Bun's native runtime.
 */
app.listen(env.API_PORT, () => {
  console.log(`🦊 Elysia server running at http://localhost:${env.API_PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
});
