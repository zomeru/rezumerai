# Code Style And Conventions

## General

- TypeScript-first across the repo.
- Biome is the formatter and linter. Root config lives in `biome.json`.
- Formatting defaults: spaces, 2-space indentation, 120-column width, double quotes.
- Tailwind classes are sorted through Biome `useSortedClasses`.
- Prefer explicit types when they improve clarity. Do not introduce `any` without a strong reason.
- Match the conventions already used in the touched file before introducing a new pattern.

## Naming And Organization

- React components: PascalCase files and component names
- Hooks: camelCase with `use` prefix
- Zustand stores: `use*Store`
- API modules: feature folders with `index.ts`, `model.ts`, `service.ts`
- Use `ROUTES` constants instead of hardcoded route strings
- Prefer shared code from `@rezumerai/types`, `@rezumerai/utils`, and `@rezumerai/ui` over app-local duplication

## Files To Avoid Editing Manually

- Generated outputs such as `.next/`, `.turbo/`, `dist/`, and `coverage/`
- Prisma generated client output under `packages/database/generated/`
- Lockstep artifacts unless the related source changed in the same task
