# AI Agent Workflow

## How To Explore The Codebase

- Prefer **Serena** for code search, symbol lookup, and reference tracing when available.
  - Use Serena instead of `rg` when searching for functions, classes, components, hooks, symbols, references, or usages across the codebase.
  - Fall back to `rg` only when Serena is unavailable, when searching for non-code text, or when doing broad text matching where semantic tools are not helpful.
- Inspect scripts, package manifests, workflows, and the touched source before trusting docs.
- Use the minimum set of matching skills needed for the task.
- When a skill applies, read its `SKILL.md` first and only load additional references that are actually needed.
- Resolve skill-relative paths from the skill directory first.

## How To Modify Code Safely

- Keep changes scoped to the task. Do not refactor unrelated areas opportunistically.
- Preserve existing architecture boundaries between `apps/web` and shared packages.
- Use `ROUTES` constants for navigation and routing.
- Regenerate artifacts instead of hand-editing generated output when possible.
- If behavior, scripts, or architecture change, update docs and `AGENTS.md` in the same change.
- Do not assume docs are authoritative over source code.

## Agent Assets In This Repository

- Local skills: `.agents/skills/<skill-name>/SKILL.md`
- GitHub agent prompts: `.github/agents/*.agent.md`
- Root compatibility link: `CLAUDE.md -> AGENTS.md`

## Do

- Read matching skills before coding.
- Align changes with the current file layout and existing scripts.
- Reuse shared packages where appropriate.
- Keep docs and code consistent when workflow changes.

## Do Not

- Use package managers other than Bun.
- Hardcode route strings when `ROUTES` exists.
- Introduce `any` without strong justification.
- Assume docs are more accurate than the implementation.
