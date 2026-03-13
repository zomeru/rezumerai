# Rezumerai AGENTS.md

This file is the canonical guide for AI coding agents working in this repository. `CLAUDE.md` must remain a symlink to this file.

## Scope And Precedence

- Verify behavior against code, scripts, and config before changing anything. Docs can lag behind implementation.
- Update this file in the same change when architecture, scripts, conventions, or agent workflows change.

## Agent Startup Checklist

Run this checklist at the start of every task:

1. Discover local skills by listing `.agents/skills/`.
2. Open `SKILL.md` for every skill that matches the task before editing.
3. Inspect the relevant code, scripts, and config first.
4. Load only the instruction files from `.agents/instructions/` that are relevant to your task (see below).

Required commands:

```sh
ls .agents/skills/
cat .agents/skills/<skill-name>/SKILL.md
```

## Performance Diagnostics

- Use `bun run benchmark:report -- --days=7` to print the current request, latency, and Prisma-query benchmark summary from collected analytics events.
- The benchmark report is based on tracked analytics data, so it is only meaningful after the target flows have been exercised.

## Deployment Bootstrap

- `bun run db:migrate` in `packages/database` is the deploy-safe path: it runs `prisma migrate deploy` and then bootstraps any missing required system configuration and public content rows.
- `bun run db:bootstrap:system` generates the Prisma client first so it can run correctly in clean CI/deploy environments where `packages/database/generated/` is absent.
- `bun run db:seed:system` remains a development reset tool that overwrites those rows back to the current defaults.

## TypeScript Config Conventions

- Shared TypeScript presets live in `packages/tsconfig/`.
- The canonical preset layout is:
  - `base.json`: common compiler semantics only
  - `library.json`: internal non-React package defaults
  - `react-library.json`: internal React package defaults
  - `next.json`: Next.js app defaults
  - `database.json`: Prisma/database package defaults
- Keep project-local `tsconfig.json` files focused on project-relative concerns only:
  - `include` / `exclude`
  - local `baseUrl`
  - local `paths` for source-level workspace aliases when a package must typecheck against sibling source
- Do not put project-relative `baseUrl`, `paths`, `outDir`, or `tsBuildInfoFile` settings into shared presets under `packages/tsconfig/`.

### Serena (Optional)

Serena provides semantic code navigation — symbol lookup, reference tracing, and structured edits. Use it when it helps; it is not required for every task.

**Use Serena when:**

- Working in large or unfamiliar areas of the codebase
- Performing symbol-level refactors
- Tracing references or usages across multiple files
- Navigating complex module relationships

**Serena is not required for:**

- Simple documentation edits
- Small config changes
- Straightforward single-file fixes

**Code search preference:** Prefer Serena for searching functions, classes, components, hooks, symbols, and references. Fall back to `rg` only when Serena is unavailable, when searching for non-code text, or when broad text matching is more appropriate than semantic lookup.

### Context7 MCP (External Documentation)

Prefer Context7 MCP for up-to-date package and framework documentation. Use it instead of relying on memory for libraries used in this repo:

- Next.js, React, Elysia, Better Auth
- Prisma, Tailwind CSS, TanStack Query
- Zustand, Bun, Turborepo, Zod

### Selective Instruction Loading

Do **not** read every file under `.agents/instructions/` automatically. Load only the files relevant to your current task.

**Examples:**

| Task type | Load these files |
| --- | --- |
| UI / frontend work | `project-overview.md`, `repository-layout.md`, `nextjs-app-router-guidelines.md`, `code-style.md`, `testing-guidelines.md` |
| Backend / API work | `architecture.md`, `elysia-api-guidelines.md`, `repository-layout.md`, `code-style.md`, `testing-guidelines.md` |
| Database / schema work | `database-commands.md`, `architecture.md`, `repository-layout.md`, `security-guidelines.md` |
| Authentication / security work | `security-guidelines.md`, `elysia-api-guidelines.md`, `nextjs-app-router-guidelines.md`, `repository-layout.md` |
| AI / LLM integration | `ai-integration-guidelines.md`, `elysia-api-guidelines.md`, `architecture.md`, `testing-guidelines.md` |
| CI / tooling work | `build-test-commands.md`, `development-workflow.md`, `docker-commands.md`, `monorepo-guidelines.md` |
| Monorepo / packages work | `monorepo-guidelines.md`, `repository-layout.md`, `typescript-guidelines.md` |
| New contributor onboarding | `project-overview.md`, `repository-layout.md`, `development-workflow.md`, `build-test-commands.md` |
| Documentation / agent workflow | `ai-agent-workflow.md`, `project-overview.md`, `repository-layout.md` |
| Commit / PR work | `commit-and-pr-guidelines.md` |

## AI Architecture

The canonical AI stack is:

- **Runtime:** Vercel AI SDK Core in the embedded Elysia API layer
- **Provider:** OpenRouter through `@openrouter/ai-sdk-provider`
- **UI:** AI SDK UI / `useChat`
- **RAG / vectors:** pgvector
- **Embeddings:** AI SDK embeddings
- **Chunking:** LangChain text splitters only

Architecture rules:

- Next.js API routes under `apps/web/src/app/api/**` are transport-only wrappers around the embedded Elysia app.
- All AI business logic stays in `apps/web/src/elysia-api/modules/ai/**`.
- Use the centralized provider registry, tool registry, and prompt composer in the AI module instead of ad hoc model/tool/prompt wiring.
- System prompts are resolved by workflow `feature + action` from `AI_CONFIG`. Keep the assistant chat prompt separate from Resume Copilot optimize/tailor/review prompts and the Text Optimizer prompt.
- Do not reintroduce Mastra, `@openrouter/sdk`, or custom assistant streaming abstractions.
- Assistant persistence must remain thread-isolated by `userId + scope + threadId`.

## Instruction Files

Detailed guidance is split into modular files under `.agents/instructions/`. Load what you need.

- **Project overview:** `.agents/instructions/project-overview.md`
- **Repository layout:** `.agents/instructions/repository-layout.md`
- **Next.js App Router guidelines:** `.agents/instructions/nextjs-app-router-guidelines.md`
- **Development workflow:** `.agents/instructions/development-workflow.md`
- **Build, lint, format, test:** `.agents/instructions/build-test-commands.md`
- **Database commands:** `.agents/instructions/database-commands.md`
- **Docker commands:** `.agents/instructions/docker-commands.md`
- **Code style and conventions:** `.agents/instructions/code-style.md`
- **Module architecture:** `.agents/instructions/architecture.md`
- **Elysia API guidelines:** `.agents/instructions/elysia-api-guidelines.md`
- **TypeScript guidelines:** `.agents/instructions/typescript-guidelines.md`
- **Unit/Browser Testing guidelines:** `.agents/instructions/testing-guidelines.md`
- **AI integration guidelines:** `.agents/instructions/ai-integration-guidelines.md`
- **AI agent workflow:** `.agents/instructions/ai-agent-workflow.md`
- **Security guidelines:** `.agents/instructions/security-guidelines.md`
- **Commit and PR guidelines:** `.agents/instructions/commit-and-pr-guidelines.md`
- **Monorepo guidance:** `.agents/instructions/monorepo-guidelines.md`


## vexp <!-- vexp v1.0.0 -->

**MANDATORY: use `run_pipeline` — do NOT grep or glob the codebase.**
vexp returns pre-indexed, graph-ranked context in a single call.

### Workflow
1. `run_pipeline` with your task description — ALWAYS FIRST (replaces all other tools)
2. Make targeted changes based on the context returned
3. `run_pipeline` again only if you need more context

### Available MCP tools
- `run_pipeline` — **PRIMARY TOOL**. Runs capsule + impact + memory in 1 call.
  Auto-detects intent. Includes file content. Example: `run_pipeline({ "task": "fix auth bug" })`
- `get_context_capsule` — lightweight, for simple questions only
- `get_impact_graph` — impact analysis of a specific symbol
- `search_logic_flow` — execution paths between functions
- `get_skeleton` — compact file structure
- `index_status` — indexing status
- `get_session_context` — recall observations from sessions
- `search_memory` — cross-session search
- `save_observation` — persist insights (prefer run_pipeline's observation param)

### Agentic search
- Do NOT use built-in file search, grep, or codebase indexing — always call `run_pipeline` first
- If you spawn sub-agents or background tasks, pass them the context from `run_pipeline`
  rather than letting them search the codebase independently

### Smart Features
Intent auto-detection, hybrid ranking, session memory, auto-expanding budget.

### Multi-Repo
`run_pipeline` auto-queries all indexed repos. Use `repos: ["alias"]` to scope. Run `index_status` to see aliases.
<!-- /vexp -->