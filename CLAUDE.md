# Claude Instructions for RezumerAI Monorepo

## Prerequisites

Before anything else, ensure MCP servers are activated on this project.

- **Activate Serena** - Call `mcp_serena_activate_project` to activate Serena MCP server on this project every time before you start working.
- **Use Context7** - Use `mcp_context7_get-library-docs` to get relevant documentation for project library and framework usage, ONLY if needed.

## Monorepo Architecture

RezumerAI is a fullstack TypeScript monorepo managed with Turborepo and Bun. It consists of:

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
- **TypeScript everywhere**: Types are centralized in `packages/types` and shared across all apps/packages. Prioritize type safety, readability, and maintainability.
- **Routing**: All routes are centralized in `apps/web/src/constants/routing.ts`. Always import and use `ROUTES` constants instead of hardcoding route strings (e.g., use `ROUTES.WORKSPACE` instead of `"/workspace"`).
- **Prisma**: Database schema and migrations in `packages/database/prisma/schema.prisma`. Use scripts in `packages/database/scripts/` for migrations.
- **Testing**: Vitest 4.x is used everywhere with comprehensive unit and end-to-end tests. Test setup files are in `src/test` or alongside components. Shared config in `packages/vitest-config`.
- **Linting/Formatting**: Biome (see `biome.json`) is the only linter/formatter. Run on save or via CLI.
- **State Management**: Zustand for client-side state (`apps/web/src/store`).
- **API Contracts**: @ts-rest for type-safe API definitions shared between frontend and backend.
- **Dynamic Routing**: Next.js App Router uses folders like `[resumeId]` under `apps/web/src/app/preview` for dynamic routes.
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
bun run db:reset       # Reset database (destroys data)
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

- **Types**: Import from `packages/types` for all shared types. Always use explicit typing.
- **Database**: Use Prisma client from `packages/database`.
- **UI**: Import shared components from `packages/ui`.
- **Utils**: Use helpers from `packages/utils`.

## Project Structure Reference

```
apps/web/src/
├── app/                   # Next.js App Router (routing, pages, layout)
│   ├── workspace/         # Authenticated app routes (dashboard, builder)
│   ├── signin/            # Sign in page
│   ├── signup/            # Sign up page
│   └── preview/           # Resume preview routes
├── components/            # React components
│   ├── Home/              # Homepage components
│   ├── Dashboard/         # Dashboard components
│   └── ResumeBuilder/     # Resume builder components
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

### Language

- TypeScript only. Strict mode enabled everywhere.

### Formatting/Linting (Biome)

- 120 char line width
- Spaces for indentation
- Double quotes for strings
- LF line endings
- Sorted Tailwind classes

### TypeScript Best Practices

- Use explicit return types for functions
- Prefer interfaces over types for object shapes
- Use type guards and discriminated unions where appropriate
- Avoid `any` – use `unknown` or proper typing
- Leverage TypeScript utility types (Partial, Pick, Omit, etc.)

### React Best Practices

- Functional components with TypeScript
- Props interfaces defined explicitly
- Use React 19 features and hooks appropriately
- Custom hooks in `apps/web/src/hooks`
- State management with Zustand
- Component composition over inheritance

### Code Organization

- Modular, readable, and well-documented code
- Single responsibility principle
- Meaningful variable and function names
- JSDoc comments for complex functions and public APIs

### Testing

- Comprehensive unit tests for utilities and functions
- Component tests using React Testing Library
- End-to-end tests for critical user flows
- Test files alongside components or in `src/test`
- Aim for high code coverage

### Styling

- Tailwind CSS 4.x for all styling
- Focus on exceptional UI/UX design
- Mobile-first responsive design
- Global styles in `packages/ui/global.css`

### Git Hooks

- Husky + lint-staged run format/lint on commit

## API Development

- **Express Backend**: Use TypeScript with Express 5.x in `apps/server`
- **Type Safety**: Use @ts-rest for type-safe API contracts shared between frontend and backend
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **Validation**: Use Zod for request validation

## Database Conventions

- **Prisma 7.x**: Schema-first approach
- Run migrations via provided scripts
- Use Prisma Client types in application code
- Leverage PostgreSQL features appropriately

## Do Not

- Do not use npm, yarn, or pnpm; always use Bun
- Do not add duplicate types/utilities — extend shared packages instead
- Do not hardcode secrets; use environment variables in `.env.local`
- Do not use `any` type; prefer proper typing or `unknown`
- Do not skip tests; maintain comprehensive test coverage
- Do not use inline styles; use Tailwind CSS classes
- Do not create components without proper TypeScript interfaces for props

## Claude-Specific Guidelines

When assisting with this codebase:

1. **Always use TypeScript** syntax and conventions
2. **Provide complete, production-ready code** with proper types
3. **Include JSDoc comments** for complex functions
4. **Suggest tests** alongside implementation when relevant
5. **Consider UI/UX implications** when working on frontend features
6. **Recommend best practices** for maintainability and scalability
7. **Flag potential issues** with type safety, performance, or accessibility
8. **Suggest modern patterns** using React 19, Next.js 16+, and TypeScript 5.x features

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

_This file provides guidance for Claude AI assistant when working with the RezumerAI monorepo. Update as project conventions evolve._
