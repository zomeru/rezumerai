# Rezumerai AGENTS.md

This file is the canonical guide for AI coding agents working in this repository. `CLAUDE.md` must remain a symlink to this file.

---

## Scope And Precedence

- Verify behavior against code, scripts, and config before changing anything. Docs can lag behind implementation.
- Update this file in the same change when architecture, scripts, conventions, or agent workflows change.

---

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

---

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

---

## Serena (Semantic Code Navigation)

Serena provides **IDE-level semantic navigation** for coding agents. Instead of scanning files with text search, it operates on **code symbols and relationships**, improving both **token efficiency and refactor safety**.

Think of Serena as giving the agent **structured awareness of the codebase**, similar to an IDE.

---

### Core Capabilities

Serena works with **code entities**, not raw text.

Common primitives:

- `find_symbol` — locate functions, classes, hooks, or components
- `find_referencing_symbols` — find where a symbol is used
- `get_symbol_definition` — inspect a symbol
- `insert_after_symbol` — insert code relative to an existing symbol
- `replace_symbol_body` — update a function or class implementation

These allow targeted edits **without reading entire files**.

---

### When to Use Serena

Prefer Serena when:

- locating functions, classes, hooks, or components
- tracing references across files
- performing refactors
- navigating unfamiliar or large parts of the codebase
- modifying an existing symbol implementation

Serena is especially useful when **symbol relationships matter**.

---

### When Serena Is Not Needed

Serena is optional for:

- documentation edits
- simple config updates
- small single-file fixes
- formatting or lint changes

---

### Code Search Priority

Use this order when locating code:

1. **Serena symbol search**
2. **Serena reference search**
3. `rg` (ripgrep) text search
4. direct file reading

Prefer Serena first to avoid unnecessary file scanning.

---

### Token Efficiency Rule

Do **not read entire files by default**.

Preferred workflow:

1. locate symbol with Serena
2. inspect only the symbol body
3. modify using symbol-aware edits

Fallback to `rg` only if Serena cannot locate the symbol.

---

## Selective Instruction Loading

Do **not automatically read every file** under `.agents/instructions/`.

Instruction files exist to reduce context size. Load **only the files relevant to the current task**.

Before loading instructions:

1. Identify the **type of task** (frontend, backend, database, CI, AI, etc).
2. Load only the instruction files that apply to that task.
3. If the task expands (e.g., API change affecting DB + frontend), load additional files as needed.

Prefer **minimal context first**, then expand if required.

---

### Common Task → Instruction Mapping

| Task type | Load these files |
|---|---|
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

---

### Safety Rule

If a task involves **architecture, authentication, database changes, or AI systems**, always load the relevant architecture/security instructions even if they were not explicitly listed above.

These areas often contain **non-obvious constraints** that must not be violated.

---

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

Each instruction file includes **task tags** and **load triggers** to help agents decide what to read.

Format:

`tags:` task categories the instruction applies to  
`load when:` situations where the instruction must be read

---

- **Project overview:** `.agents/instructions/project-overview.md`  
  `tags:` onboarding, architecture, product  
  `load when:` starting unfamiliar work or needing high-level system context.

- **Repository layout:** `.agents/instructions/repository-layout.md`  
  `tags:` navigation, monorepo, structure  
  `load when:` locating packages, modules, or understanding directory structure.

- **Next.js App Router guidelines:** `.agents/instructions/nextjs-app-router-guidelines.md`  
  `tags:` frontend, nextjs, routing  
  `load when:` working on UI routes, layouts, server/client boundaries, or page data fetching.

- **Development workflow:** `.agents/instructions/development-workflow.md`  
  `tags:` dev, environment, tooling  
  `load when:` setting up the environment or running the project locally.

- **Build, lint, format, test:** `.agents/instructions/build-test-commands.md`  
  `tags:` ci, verification, tooling  
  `load when:` validating changes, running checks, or troubleshooting CI failures.

- **Database commands:** `.agents/instructions/database-commands.md`  
  `tags:` database, prisma, migrations  
  `load when:` modifying schema, running migrations, seeding, or inspecting DB data.

- **Docker commands:** `.agents/instructions/docker-commands.md`  
  `tags:` docker, infra  
  `load when:` building or running containers.

- **Code style:** `.agents/instructions/code-style.md`  
  `tags:` formatting, typescript, conventions  
  `load when:` editing code to ensure style and naming rules are followed.

- **Architecture:** `.agents/instructions/architecture.md`  
  `tags:` architecture, backend, system-design  
  `load when:` implementing new features or modifying module structure.

- **Elysia API guidelines:** `.agents/instructions/elysia-api-guidelines.md`  
  `tags:` backend, api, elysia  
  `load when:` adding or modifying API modules.

- **TypeScript guidelines:** `.agents/instructions/typescript-guidelines.md`  
  `tags:` typescript, typing  
  `load when:` making type-heavy changes or modifying shared TS configs.

- **Testing guidelines:** `.agents/instructions/testing-guidelines.md`  
  `tags:` testing, vitest, playwright  
  `load when:` writing tests or debugging test failures.

- **AI integration guidelines:** `.agents/instructions/ai-integration-guidelines.md`  
  `tags:` ai, llm, rag  
  `load when:` modifying AI modules, prompts, model configuration, or embeddings.

- **AI agent workflow:** `.agents/instructions/ai-agent-workflow.md`  
  `tags:` agents, workflow  
  `load when:` starting a coding task or deciding how to explore the repository.

- **Security guidelines:** `.agents/instructions/security-guidelines.md`  
  `tags:` security, auth, secrets  
  `load when:` modifying authentication, permissions, or sensitive data handling.

- **Commit and PR guidelines:** `.agents/instructions/commit-and-pr-guidelines.md`  
  `tags:` git, workflow  
  `load when:` preparing commits or pull requests.

- **Monorepo guidelines:** `.agents/instructions/monorepo-guidelines.md`  
  `tags:` monorepo, turborepo, packages  
  `load when:` modifying multiple packages or adding new workspace packages.

---

<!-- rtk-instructions v2 -->
## RTK (Rust Token Killer) - Token-Optimized Commands

### Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:

```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

### RTK Commands by Workflow

#### Build & Compile (80-90% savings)

```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

#### Test (90-99% savings)

```bash
rtk cargo test          # Cargo test failures only (90%)
rtk vitest run          # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk test <cmd>          # Generic test wrapper - failures only
```

#### Git (59-80% savings)

```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

#### GitHub (26-87% savings)

```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

#### JavaScript/TypeScript Tooling (70-90% savings)

```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

#### Files & Search (60-75% savings)

```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

#### Analysis & Debug (70-90% savings)

```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

#### Infrastructure (85% savings)

```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

#### Network (65-70% savings)

```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

#### Meta Commands

```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

### Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->