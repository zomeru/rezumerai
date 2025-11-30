
# Copilot Instructions for RezumerAI Monorepo

## Monorepo Architecture
RezumerAI is a fullstack TypeScript monorepo managed with Turborepo and pnpm. It consists of:
- `apps/web`: Next.js frontend (dynamic routing, React 19, TypeScript)
- `apps/server`: Express API (Node.js, TypeScript)
- `packages/database`: Prisma schema, migration scripts, and DB utilities
- `packages/types`, `packages/utils`, `packages/ui`, `packages/vitest-config`, `packages/tsconfig`: Shared types, utilities, UI components, and configs

### Key Patterns & Structure
- **pnpm workspaces**: All dependency management and scripts use pnpm (v10.24.0+). Never use npm or yarn.
- **TypeScript everywhere**: Types are centralized in `packages/types` and shared across all apps/packages.
- **Prisma**: Database schema and migrations in `packages/database/prisma/schema.prisma`. Use scripts in `packages/database/scripts/` for migrations.
- **Testing**: Vitest is used everywhere. Test setup files are in `src/test` or alongside components. Shared config in `packages/vitest-config`.
- **Linting/Formatting**: Biome (see `biome.json`) is the only linter/formatter. Run on save or via CLI.
- **Dynamic Routing**: Next.js app uses folders like `[resumeId]` under `apps/web/src/app/builder` and `apps/web/src/app/view` for dynamic routes.
- **Component/Hook Structure**: Place React components in `apps/web/src/components`, hooks in `apps/web/src/hooks`.
- **Resume Templates**: In `apps/web/src/templates`.
- **Shared UI**: Use and extend components in `packages/ui/src/components`.
- **Utilities**: Use helpers from `packages/utils/src`.

## Developer Workflows
- **Install dependencies:**
  ```sh
  corepack enable && corepack prepare pnpm@10.24.0 --activate
  pnpm install
  ```
- **Run all apps in dev mode:**
  ```sh
  pnpm dev
  # or individually:
  pnpm --filter=web dev
  pnpm --filter=server dev
  ```
- **Run database migrations:**
  ```sh
  pnpm --filter=database run migrate:dev
  # or use scripts in packages/database/scripts/
  ```
- **Run with Docker:**
  ```sh
  docker compose up --build
  ```
- **Testing:**
  ```sh
  pnpm test
  pnpm test:watch
  ```
- **Lint/format:**
  ```sh
  pnpm lint
  pnpm lint:fix
  pnpm format
  pnpm format:fix
  ```

## Integration Points
- **Types**: Import from `packages/types` for all shared types.
- **Database**: Use Prisma client from `packages/database`.
- **UI**: Import shared components from `packages/ui`.
- **Utils**: Use helpers from `packages/utils`.

## Project Structure Reference
- `apps/web/src/app` – Next.js app directory (routing, pages, layout)
- `apps/web/src/components` – Shared React components
- `apps/web/src/hooks` – Custom React hooks
- `apps/web/src/templates` – Resume templates
- `apps/server/src` – Express server entrypoint and tests
- `packages/database/prisma/schema.prisma` – Prisma schema
- `packages/database/scripts/migrate-dev.sh` – Migration script
- `packages/types/src/index.ts` – Shared types
- `packages/utils/src/` – Utility functions

## Code Style & Conventions
- **Formatting/Linting**: Biome only. 120 char line width, spaces, LF endings, double quotes.
- **TypeScript**: Strict everywhere. Shared configs in `packages/tsconfig`.
- **Testing**: Vitest for all code. Use Testing Library for React. Place tests in `src/test` or next to components.
- **Styling**: Tailwind CSS (with PostCSS). Global styles in `packages/ui/global.css`.
- **Git Hooks**: Husky + lint-staged run format/lint on commit.

## Do Not
- Do not use npm or yarn; always use pnpm.
- Do not add duplicate types/utilities—extend shared packages instead.
- Do not hardcode secrets; use environment variables in `.env.local`.

---

_This file is auto-generated. Update as project conventions evolve._
