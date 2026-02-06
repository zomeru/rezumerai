# Copilot Instructions for Rezumer Monorepo

## Prerequisites

Before anything else, ensure MCP servers are activated on this project.

- **Activate Serena** - Call `mcp_serena_activate_project` to activate Serena MCP server on this project every time before you start working.
- **Use Context7** - Use `mcp_context7_get-library-docs` to get relevant documentation for project library and framework usage, ONLY if needed.

## Monorepo Architecture

Rezumer is a fullstack TypeScript monorepo managed with Turborepo and Bun. It consists of:

- `apps/web`: Next.js 16+ frontend (App Router, React 19, TypeScript, Tailwind CSS 4.x)
- `apps/server`: Express 5.x API (Node.js, TypeScript, @ts-rest)
- `packages/database`: Prisma 7.x schema, migration scripts, and DB utilities
- `packages/types`: Shared TypeScript types
- `packages/utils`: Shared utility functions
- `packages/ui`: Shared UI components (shadcn/ui based)
- `packages/vitest-config`: Shared Vitest configuration
- `packages/tsconfig`: Shared TypeScript configs

### Key Patterns & Structure

- **Bun workspaces**: All dependency management and scripts use Bun (v1.3.8+). Never use npm, yarn, or pnpm.
- **TypeScript everywhere**: Types are centralized in `packages/types` and shared across all apps/packages.
- **Routing**: All routes are centralized in `apps/web/src/constants/routing.ts`. Always import and use `ROUTES` constants instead of hardcoding route strings.
- **Prisma**: Database schema and migrations in `packages/database/prisma/schema.prisma`. Use scripts in `packages/database/scripts/` for migrations.
- **Testing**: Vitest 4.x is used everywhere. Test setup files are in `src/test` or alongside components. Shared config in `packages/vitest-config`.
- **Linting/Formatting**: Biome (see `biome.json`) is the only linter/formatter. Run on save or via CLI.
- **State Management**: Zustand for client-side state (`apps/web/src/store`).
- **API Contracts**: @ts-rest for type-safe API definitions.
- **Dynamic Routing**: Next.js App Router uses folders like `[resumeId]` under `apps/web/src/app/preview` or `apps/web/src/app/workspace/builder` for dynamic routes.
- **Component/Hook Structure**: Place React components in `apps/web/src/components`, hooks in `apps/web/src/hooks`.
- **Resume Templates**: In `apps/web/src/templates` (Classic, Modern, Minimal, MinimalImage).
- **Shared UI**: Use and extend components in `packages/ui/src/components`.
- **Utilities**: Use helpers from `packages/utils/src`.

## Developer Workflows

### Install dependencies

```sh
bun install
```

### Run all apps in dev mode

```sh
bun run dev
# or individually:
bun run --filter=web dev       # Next.js on http://localhost:3000
bun run --filter=server dev    # Express on http://localhost:8080
```

### Database operations

```sh
bun run docker:db      # Start PostgreSQL and Redis containers
bun run db:setup       # Push schema and generate Prisma client
bun run db:studio      # Open Prisma Studio (port 5556)
```

### Run with Docker

```sh
bun run docker:build   # Build and start all containers
bun run docker:up      # Start containers
bun run docker:down    # Stop containers
```

### Testing

```sh
bun run test           # Run all tests
bun run test:watch     # Run tests in watch mode
bun run test:ui        # Open Vitest UI
bun run test:coverage  # Run tests with coverage
```

### Lint/format

```sh
bun run check          # Run Biome linting with auto-fix
bun run check-types    # Run TypeScript type checking
bun run code:check     # Run both linting and type checking
```

## Integration Points

- **Types**: Import from `packages/types` for all shared types.
- **Database**: Use Prisma client from `packages/database`.
- **UI**: Import shared components from `packages/ui`.
- **Utils**: Use helpers from `packages/utils`.

## Project Structure Reference

```
apps/web/src/
├── app/                   # Next.js App Router
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Library utilities
├── store/                 # Zustand state stores
├── templates/             # Resume templates
├── constants/             # App constants
└── test/                  # Test utilities

apps/server/src/
├── server.ts              # Express server entrypoint
└── test/                  # Server tests

packages/
├── database/prisma/schema.prisma   # Prisma schema
├── types/src/index.ts              # Shared types
├── ui/src/                         # Shared UI components
└── utils/src/                      # Utility functions
```

## Code Style & Conventions

- **Language**: TypeScript only. Strict mode enabled everywhere.
- **Formatting/Linting**: Biome only. 120 char line width, spaces, LF endings, double quotes.
- **Testing**: Vitest for all code. Use Testing Library for React. Place tests in `src/test` or next to components.
- **Styling**: Tailwind CSS 4.x (with PostCSS). Global styles in `packages/ui/global.css`.
- **Git Hooks**: Husky + lint-staged run format/lint on commit.

## Do Not

- Do not use npm, yarn, or pnpm; always use Bun.
- Do not add duplicate types/utilities — extend shared packages instead.
- Do not hardcode secrets; use environment variables in `.env.local`.
- Do not use `any` type; prefer proper typing or `unknown`.
- Do not skip tests; maintain comprehensive test coverage.

## Technology Stack Summary

| Category | Technology |
|----------|------------|
| Frontend | Next.js 16+, React 19, TypeScript, Tailwind CSS 4.x |
| Backend | Express 5.x, Node.js, TypeScript |
| Database | PostgreSQL with Prisma 7.x ORM |
| State | Zustand |
| API | @ts-rest for type-safe contracts |
| Testing | Vitest 4.x, React Testing Library |
| Build | Turborepo, Bun |
| Code Quality | Biome |

## Output Rules

- Be concise. Short answers unless detail is requested.
- No verbose explanations, summaries, or recaps unless asked.
- Show code changes, not descriptions of what you'll change.

---

_This file provides guidance for GitHub Copilot when working with the Rezumer monorepo. Update as project conventions evolve._
