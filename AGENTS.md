# Rezumerai AGENTS.md

This file is the canonical guide for AI coding agents working in this repository. `CLAUDE.md` must remain a symlink to this file.

## Scope And Precedence

- This file applies repo-wide unless a deeper `AGENTS.md` exists closer to the file being changed.
- Follow instructions in this order: direct user request, nearest `AGENTS.md`, parent `AGENTS.md`.
- Verify behavior against code, scripts, and config before changing anything. Docs can lag behind implementation.
- Update this file in the same change when architecture, scripts, conventions, or agent workflows change.

## Agent Startup Checklist

Run this checklist at the start of every task:

1. Discover local skills by listing `.agents/skills/`.
2. Open `SKILL.md` for every skill that matches the task before editing.
3. Inspect the relevant code, scripts, and config first.
4. Check for a nearer `AGENTS.md` if you are working outside the repo root.
5. Load only the instruction files from `.agents/instructions/` that are relevant to your task (see below).

Required commands:

```sh
ls .agents/skills/
cat .agents/skills/<skill-name>/SKILL.md
```

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
| UI / frontend work | `code-style.md`, `architecture.md`, `testing-guidelines.md` |
| Backend / API work | `architecture.md`, `code-style.md`, `testing-guidelines.md` |
| Database / schema work | `database-commands.md`, `architecture.md`, `security-guidelines.md` |
| Auth / security work | `security-guidelines.md`, `architecture.md` |
| CI / tooling work | `build-test-commands.md`, `development-workflow.md`, `monorepo-guidelines.md` |
| New contributor onboarding | `project-overview.md`, `repository-layout.md`, `development-workflow.md` |
| Commit / PR work | `commit-and-pr-guidelines.md` |

## Instruction Files

Detailed guidance is split into modular files under `.agents/instructions/`. Load what you need.

- **Project overview:** `.agents/instructions/project-overview.md`
- **Repository layout:** `.agents/instructions/repository-layout.md`
- **Development workflow:** `.agents/instructions/development-workflow.md`
- **Build, lint, format, test:** `.agents/instructions/build-test-commands.md`
- **Database commands:** `.agents/instructions/database-commands.md`
- **Docker commands:** `.agents/instructions/docker-commands.md`
- **Code style and conventions:** `.agents/instructions/code-style.md`
- **Module architecture:** `.agents/instructions/architecture.md`
- **TypeScript guidelines:** `.agents/instructions/typescript-guidelines.md`
- **Testing guidelines:** `.agents/instructions/testing-guidelines.md`
- **AI agent workflow:** `.agents/instructions/ai-agent-workflow.md`
- **Security guidelines:** `.agents/instructions/security-guidelines.md`
- **Commit and PR guidelines:** `.agents/instructions/commit-and-pr-guidelines.md`
- **Monorepo guidance:** `.agents/instructions/monorepo-guidelines.md`
