# Assistant RAG Memory Design

**Goal:** Add a production-ready, user-scoped conversation memory system for the assistant using pgvector-backed semantic recall plus a recent-message window.

**Architecture:**
- Keep assistant chat generation separate from embedding generation.
- Store relational conversation messages in Prisma-managed tables.
- Store message-level embeddings in a dedicated pgvector table queried with raw SQL.
- Build assistant context from `recent window + semantic recall`, then pass the merged context to the existing Mastra agent flow.

**Key Decisions:**
- Message-level chunking for v1
- Separate `EmbeddingProvider` abstraction
- Async, failure-safe embedding indexing after message persistence
- Strict retrieval filters on `conversationId`, `scope`, and `userId`
- Token budget enforcement before the agent call

**Files Added:**
- `apps/web/src/elysia-api/modules/ai/embeddings/provider.ts`
- `apps/web/src/elysia-api/modules/ai/embeddings/openrouter-provider.ts`
- `apps/web/src/elysia-api/modules/ai/embeddings/service.ts`
- `apps/web/src/elysia-api/modules/ai/memory/chunking.ts`
- `apps/web/src/elysia-api/modules/ai/memory/retrieval.ts`
- `apps/web/src/elysia-api/modules/ai/memory/repository.ts`
- `apps/web/src/elysia-api/modules/ai/memory/service.ts`
- `apps/web/scripts/reindex-assistant-memory.ts`
- `packages/database/prisma/migrations/20260309195000_add_ai_assistant_conversation_embeddings/migration.sql`

**Files Updated:**
- `apps/web/src/elysia-api/modules/ai/service.ts`
- `apps/web/src/elysia-api/modules/ai/repository.ts`
- `apps/web/src/elysia-api/modules/ai/types.ts`
- `apps/web/src/elysia-api/modules/ai/assistant-agent.ts`
- `apps/web/package.json`
- `packages/types/src/ai/schema.ts`
- `packages/database/prisma/models/ai.prisma`
- `packages/database/prisma/models/user.prisma`
- `packages/database/package.json`

**Verification:**
- AI module unit tests
- `apps/web` type check
- `packages/database` type check + Prisma generation
- `apps/web` production build
- `packages/database` build
