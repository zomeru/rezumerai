# TypeScript Guidelines

## Strict Mode

- Strict mode is enabled in the root, web, database, and types configs.
- `packages/ui` and `packages/utils` currently inherit shared presets with `strict: false`.
- Do not assume shared packages are fully strict when refactoring types.

## General Expectations

- TypeScript-first across the repo. See `code-style.md` for formatting and naming conventions.
- Prefer explicit types when they improve clarity.
- Do not introduce `any` without strong justification.
- Shared TypeScript presets live in `packages/tsconfig/`.
