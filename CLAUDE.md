# Claude Instructions for RezumerAI Monorepo

## Prerequisites
Before anything else, ensure mcp servers are activated on this project.
- **Activate Serena** - Call `mcp_serena_activate_project` to activate Serena MCP server on this project every time before you start working.
- **Use Context** - Use `mcp_context7_get-library-docs` to get relevant documentation for project library and framework usage, ONLY if needed.

## Monorepo Architecture
RezumerAI is a fullstack TypeScript monorepo managed with Turborepo and Bun. It consists of:
- `apps/web`: Next.js frontend (dynamic routing, React 19, TypeScript)
- `apps/server`: Express API (Node.js, TypeScript)
- `packages/database`: Prisma schema, migration scripts, and DB utilities
- `packages/types`, `packages/utils`, `packages/ui`, `packages/vitest-config`, `packages/tsconfig`: Shared types, utilities, UI components, and configs

### Key Patterns & Structure
- **Bun workspaces**: All dependency management and scripts use Bun. Never use npm, yarn, or pnpm.
- **TypeScript everywhere**: Types are centralized in `packages/types` and shared across all apps/packages. Prioritize type safety, readability, and maintainability.
- **Prisma**: Database schema and migrations in `packages/database/prisma/schema.prisma`. Use scripts in `packages/database/scripts/` for migrations.
- **Testing**: Vitest is used everywhere with comprehensive unit and end-to-end tests. Test setup files are in `src/test` or alongside components. Shared config in `packages/vitest-config`.
- **Linting/Formatting**: Biome (see `biome.json`) is the only linter/formatter. Run on save or via CLI.
- **Dynamic Routing**: Next.js app uses folders like `[resumeId]` under `apps/web/src/app/builder` and `apps/web/src/app/view` for dynamic routes.
- **Component/Hook Structure**: Place React components in `apps/web/src/components`, hooks in `apps/web/src/hooks`.
- **Resume Templates**: In `apps/web/src/templates`.
- **Shared UI**: Use and extend components in `packages/ui/src/components`.
- **Utilities**: Use helpers from `packages/utils/src`.

## Developer Workflows
- **Install dependencies:**
  ```sh
  bun install
  ```
- **Run all apps in dev mode:**
  ```sh
  bun run dev
  # or individually:
  bun run --filter=web dev
  bun run --filter=server dev
  ```
- **Run database migrations:**
  ```sh
  bun run --filter=database migrate:dev
  # or use scripts in packages/database/scripts/
  ```
- **Run with Docker:**
  ```sh
  docker compose up --build
  ```
- **Testing:**
  ```sh
  bun run test
  bun run test:watch
  ```
- **Lint/format:**
  ```sh
  bun run check
  bun run check-types
  ```

## Integration Points
- **Types**: Import from `packages/types` for all shared types. Always use explicit typing.
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
- **Language**: TypeScript only. Strict mode enabled everywhere.
- **Formatting/Linting**: Biome only. 120 char line width, spaces, LF endings, double quotes.
- **TypeScript Best Practices**:
  - Use explicit return types for functions
  - Prefer interfaces over types for object shapes
  - Use type guards and discriminated unions where appropriate
  - Avoid `any` – use `unknown` or proper typing
  - Leverage TypeScript utility types (Partial, Pick, Omit, etc.)
- **React Best Practices**:
  - Functional components with TypeScript
  - Props interfaces defined explicitly
  - Use React 19 features and hooks appropriately
  - Custom hooks in `apps/web/src/hooks`
  - Component composition over inheritance
- **Code Organization**:
  - Modular, readable, and well-documented code
  - Single responsibility principle
  - Meaningful variable and function names
  - JSDoc comments for complex functions and public APIs
- **Testing**:
  - Comprehensive unit tests for utilities and functions
  - Component tests using React Testing Library
  - End-to-end tests for critical user flows
  - Test files alongside components or in `src/test`
  - Aim for high code coverage
- **Styling**:
  - Tailwind CSS (with PostCSS) for all styling
  - Focus on exceptional UI/UX design
  - Mobile-first responsive design
  - Global styles in `packages/ui/global.css`
- **Git Hooks**: Husky + lint-staged run format/lint on commit.

## API Development
- **Express Backend**: Use TypeScript with Express in `apps/server`
- **Type Safety**: Share types between frontend and backend via `packages/types`
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **Validation**: Use Zod or similar for request validation

## Database Conventions
- **Prisma**:
  - Schema-first approach
  - Run migrations via provided scripts
  - Use Prisma Client types in application code
  - Leverage PostgreSQL features appropriately

## Do Not
- Do not use npm, yarn, or pnpm; always use Bun.
- Do not add duplicate types/utilities — extend shared packages instead.
- Do not hardcode secrets; use environment variables in `.env.local`.
- Do not use `any` type; prefer proper typing or `unknown`.
- Do not skip tests; maintain comprehensive test coverage.
- Do not use inline styles; use Tailwind CSS classes.
- Do not create components without proper TypeScript interfaces for props.

## Claude-Specific Guidelines
When assisting with this codebase:
1. **Always use TypeScript** syntax and conventions
2. **Provide complete, production-ready code** with proper types
3. **Include JSDoc comments** for complex functions
4. **Suggest tests** alongside implementation when relevant
5. **Consider UI/UX implications** when working on frontend features
6. **Recommend best practices** for maintainability and scalability
7. **Flag potential issues** with type safety, performance, or accessibility
8. **Suggest modern patterns** using React 19, Next.js 15+, and TypeScript 5.x features

## Technology Stack Summary
- **Frontend**: Next.js 15+, React 19, TypeScript, Tailwind CSS
- **Backend**: Express, Node.js, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Vitest, React Testing Library
- **Build Tools**: Turborepo, Bun
- **Code Quality**: Biome (linting & formatting)

## Output Rules
- Be concise. Short answers unless detail is requested.
- No verbose explanations, summaries, or recaps unless asked.
- Show code changes, not descriptions of what you'll change.

---

_This file provides guidance for Claude AI assistant when working with the RezumerAI monorepo. Update as project conventions evolve._
