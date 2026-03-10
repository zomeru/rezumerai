# AI Integration Guidelines

## Main AI Areas

- AI routes live in `apps/web/src/elysia-api/modules/ai/`.
- The AI stack covers:
  - assistant chat and history
  - resume Copilot optimize/tailor/review flows
  - streamed text optimization
  - per-user AI model selection
  - assistant memory and embeddings

## Providers And Configuration

- OpenRouter is the active model and embedding provider.
- Runtime AI configuration is stored in system configuration and seeded by `bun run db:seed:ai`.
- Do not hardcode prompts, model IDs, or limits when the existing AI config already owns them.
- Active model availability comes from database records in `ai_provider` and `ai_model`.

## Access And Safety Rules

- Copilot, optimize-text, and model settings require a verified non-anonymous user.
- The assistant supports `PUBLIC`, `USER`, and `ADMIN` scopes.
- Do not bypass credit checks, model-availability checks, or role/scope guards.
- Assistant and Copilot responses must stay grounded in retrieved data. Reuse the existing tool layer instead of fabricating account, resume, admin, or analytics details.

## Persistence And Telemetry

- AI optimization runs are persisted in `AiOptimization`.
- Daily credits are tracked in `AiTextOptimizerCredits`.
- Assistant history and embeddings are stored in the assistant conversation tables.
- Keep handled AI failures going through the existing tracking helpers so audit/error data stays complete.

## Assistant Architecture

- The assistant uses Mastra for the agent and memory layer.
- Memory runtime lives under `apps/web/src/elysia-api/modules/ai/memory/`.
- PostgreSQL + `pgvector` back assistant recall and embeddings.
- Reindex support exists through `apps/web/scripts/reindex-assistant-memory.ts` and `bun run assistant:reindex-memory`.

## Copilot And Tools

- Reuse existing Copilot and assistant tools under `apps/web/src/elysia-api/modules/ai/tools/`.
- Copilot patches are meant to be reviewable client-side drafts, not silent server-side mutations.
- Keep resume ownership checks in place when loading resume content for AI flows.

## Database And Seeds

- `bun run db:seed:ai` seeds:
  - AI providers and models
  - default AI configuration
  - default public content used by the assistant and public pages
- If you change AI configuration shape or assistant persistence, update seeds, types, and docs together.
