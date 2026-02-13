# Copilot Instructions for Rezumer Monorepo

## Prerequisites

Before anything else, ensure MCP servers are activated on this project.

- **Activate Serena** — Call `mcp_serena_activate_project` to activate Serena MCP server on this project every time before you start working.
- **Use Context7** — Use `mcp_context7_query-docs` to get relevant documentation for project library and framework usage, ONLY if needed.

## Monorepo Architecture

Rezumer (Rezumerai) is an AI-powered resume builder — a fullstack TypeScript monorepo managed with Turborepo and Bun. It consists of:

- `apps/web`: Next.js 16+ frontend (App Router, React 19, React Compiler, Turbopack, TypeScript, Tailwind CSS 4.x)
- `apps/api`: Elysia API (Bun-native, TypeScript, Zod 4.x validation, Eden type safety)
- `packages/database`: Prisma 7.x schema, migration scripts, and DB utilities (PostgreSQL 18)
- `packages/types`: Shared TypeScript types and Zod schemas
- `packages/utils`: Shared utility functions (date, string, styles/cn)
- `packages/ui`: Shared UI components (shadcn/ui based — Button, Badge, Skeleton, etc.)
- `packages/vitest-config`: Shared Vitest 4.x configurations (base, react, node)
- `packages/tsconfig`: Shared TypeScript configs (base, next, database, types, ui, utils)

### Key Patterns & Structure

- **Bun workspaces**: All dependency management and scripts use Bun (v1.x+). Never use npm, yarn, or pnpm.
- **TypeScript everywhere**: Types are centralized in `packages/types` and shared across all apps/packages. Prioritize type safety, readability, and maintainability.
- **Eden treaty**: `apps/web/src/lib/api.ts` creates a type-safe Eden client from the exported `App` type in `apps/api/src/app.ts`. This provides end-to-end type safety for all API calls.
- **Routing**: All routes are centralized in `apps/web/src/constants/routing.ts`. Always import and use `ROUTES` constants instead of hardcoding route strings (e.g., use `ROUTES.WORKSPACE` instead of `"/workspace"`).
- **Prisma**: Database schema in `packages/database/prisma/schema.prisma`. Prisma client generated to `packages/database/generated/prisma/`. Uses client engine type.
- **Testing**: Vitest 4.x with shared configs from `packages/vitest-config`. React tests use jsdom + React Testing Library. Node tests use node environment. Test setup in `src/test/setup.ts`. **Test Organization**: Component tests are co-located with their components in `__tests__` folders (e.g., `components/Badge.tsx` → `components/__tests__/Badge.test.tsx`). Root-level components keep tests in `src/__tests__`.
- **Linting/Formatting**: Biome 2.x+ is the only linter/formatter. Key rules: `useExplicitType: "error"`, `useSortedClasses`, `noUnusedImports: "warn"`, `noUnusedVariables: "error"`.
- **State Management**: Zustand 5.x for client-side state (`useResumeStore`, `useBuilderStore`, `useDashboardStore`).
- **Data Fetching**: TanStack React Query 5.x via `Providers` component with `QueryClientProvider`.
- **Dynamic Routing**: Next.js App Router uses `[resumeId]` folders under `workspace/builder/` and `preview/`.
- **Resume Templates**: 4 templates in `apps/web/src/templates/` — Classic, Modern, Minimal, MinimalImage.
- **Rich Text**: TipTap 3.x for resume content editing.
- **PDF Generation**: `@react-pdf/renderer`, `jspdf`, `html2canvas-pro`.
- **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable` for section reordering.
- **Shared UI**: Use and extend components in `packages/ui/src/components`.
- **Utilities**: Use helpers from `packages/utils/src` (`formatDate`, `capitalize`, `cn`).

## Developer Workflows

### Install dependencies

```sh
bun install
```

### Run all apps in dev mode

```sh
bun run dev
# or individually:
bun run --filter=web dev            # Next.js on http://localhost:3000 (Turbopack)
bun run --filter=@rezumerai/api dev # Elysia on http://localhost:8080
```

### Database operations

```sh
bun run docker:db      # Start PostgreSQL container (port 5432)
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
bun run test           # Run all tests (Vitest)
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

### Build

```sh
bun run build              # Build all packages and apps
bun run build:production   # Production build
```

### Clean

```sh
bun run clean              # Clean all build artifacts
bun run clean:install      # Full clean + reinstall + rebuild packages
```

## Integration Points

- **Types**: Import from `packages/types` for all shared types and Zod schemas. Always use explicit typing.
- **Database**: Use Prisma client from `packages/database` (exported as `prisma`).
- **UI**: Import shared components from `packages/ui`.
- **Utils**: Use helpers from `packages/utils` (`formatDate`, `capitalize`, `cn`).
- **API Client**: Use Eden treaty client from `apps/web/src/lib/api.ts`.

## Project Structure Reference

```
apps/web/src/
├── app/                   # Next.js App Router
│   ├── layout.tsx         # Root layout (Outfit font, Providers)
│   ├── page.tsx           # Homepage
│   ├── error.tsx          # Root error boundary
│   ├── global-error.tsx   # Global error boundary
│   ├── not-found.tsx      # 404 page
│   ├── globals.css        # Global styles
│   ├── signin/            # Sign in page (page.tsx, error.tsx)
│   ├── signup/            # Sign up page (page.tsx, error.tsx)
│   ├── workspace/         # Dashboard + builder
│   │   ├── page.tsx       # Dashboard
│   │   ├── layout.tsx     # Workspace layout
│   │   ├── loading.tsx    # Loading state
│   │   ├── error.tsx      # Error boundary
│   │   └── builder/
│   │       ├── page.tsx   # Builder index
│   │       └── [resumeId]/  # Resume builder (dynamic)
│   │           ├── page.tsx
│   │           ├── loading.tsx
│   │           └── error.tsx
│   ├── preview/[resumeId]/ # Resume preview (page.tsx, error.tsx)
│   └── testsite/          # Test page
├── components/
│   ├── Home/              # Homepage: Hero, Feature, Testimonial, Footer, CallToAction
│   ├── Dashboard/         # Dashboard: ResumeCard, CreateResumeModal, UploadResumeModal,
│   │                      #   DownloadResumeModal, EditResumeModal, BaseModal, ActionButtons
│   ├── ResumeBuilder/     # Resume builder
│   │   ├── Inputs/        # TextInput, FormField, SectionHeader, DeleteButton, EmptyState
│   │   ├── PersonalInfoForm.tsx
│   │   ├── ExperienceFormEnhanced.tsx
│   │   ├── EducationFormEnhanced.tsx
│   │   ├── SkillsFormEnhanced.tsx
│   │   ├── ProjectFormEnhanced.tsx
│   │   ├── ProfessionalSummaryFormEnhanced.tsx
│   │   ├── RichTextEditor.tsx
│   │   ├── ResumePreview.tsx
│   │   ├── PDFPreview.tsx
│   │   ├── TemplateSelector.tsx
│   │   ├── ColorPickerModal.tsx
│   │   ├── DraggableList.tsx
│   │   ├── FontSizeSelector.tsx
│   │   ├── DatePicker.tsx
│   │   ├── LazyComponents.tsx  # Code-split lazy imports
│   │   └── LoadingSkeletons.tsx # Loading skeleton components
│   ├── Navbar.tsx, Logo.tsx, Loader.tsx
│   ├── providers.tsx      # QueryClientProvider wrapper (React Query)
│   ├── ErrorBoundary.tsx   # React error boundary component
│   ├── SafeComponents.tsx  # Safe component wrappers
│   ├── client-date.tsx     # Client-side date component
│   └── user-fetcher.tsx
├── hooks/
│   ├── useClickOutside.ts  # Click outside detection
│   ├── useClientDate.ts    # Client-side date formatting
│   ├── useFocusTrap.ts     # Focus trap for modals/dialogs
│   └── usePdfGenerator.ts  # PDF generation hook
├── lib/
│   ├── api.ts             # Eden treaty client (type-safe API)
│   ├── api-client.ts      # API client with retry/error handling
│   ├── errors.ts          # Error logging, severity levels, monitoring
│   ├── retry.ts           # Exponential backoff retry logic
│   ├── pdfUtils.ts        # PDF generation utilities
│   └── utils.ts           # General utilities
├── env.ts                 # Zod-validated env vars (NEXT_PUBLIC_API_URL, etc.)
├── proxy.ts               # Security middleware (CSP, HSTS, X-Frame-Options)
├── store/
│   ├── useResumeStore.ts   # Resume CRUD state
│   ├── useBuilderStore.ts  # Builder UI state
│   └── useDashboardStore.ts
├── templates/
│   ├── ClassicTemplate.tsx
│   ├── ModernTemplate.tsx
│   ├── MinimalTemplate.tsx
│   ├── MinimalImageTemplate.tsx
│   ├── HtmlContent.tsx
│   ├── index.tsx          # Template barrel exports
│   └── types.ts           # TemplateProps, TemplateType
├── constants/
│   ├── routing.ts          # ROUTES constant
│   ├── dummy.ts            # Sample resume data (Resume type)
│   ├── pdf.ts              # PDF constants
│   ├── templates.ts        # Template constants
│   └── index.ts            # APP_NAME, LOGO_TEXT
└── test/                  # Test utilities

apps/api/src/
├── app.ts                 # Elysia app (exports App type for Eden)
├── server.ts              # Bun server entrypoint
├── env.ts                 # Zod-validated env (API_PORT, DATABASE_URL, NEXTAUTH_SECRET, CORS_ORIGINS)
├── modules/
│   ├── auth/              # Auth module (index.ts, service.ts, model.ts)
│   └── user/              # User module (index.ts, service.ts, model.ts)
├── plugins/
│   ├── prisma.ts          # Decorates context with `db` (Prisma client)
│   ├── auth.ts            # Validates NextAuth session, injects `user`
│   ├── error.ts           # Centralized error responses (422, 404, 400, 500)
│   └── logger.ts          # Request logging (method, path, status, duration)
└── test/                  # API tests

packages/
├── database/
│   ├── prisma/schema.prisma   # Prisma schema (PostgreSQL, client engine)
│   ├── generated/prisma/      # Generated Prisma client
│   ├── index.ts               # Exports prisma singleton (PrismaPg adapter)
│   └── scripts/migrate-dev.sh # Migration script
├── types/src/index.ts         # UserType, ProjectType, ApiResponse<T>, Zod schemas
├── utils/src/                 # date.ts (formatDate), string.ts (capitalize), styles.ts (cn)
├── ui/src/
│   ├── button.tsx             # Button component
│   ├── index.tsx              # Barrel exports
│   └── components/            # Badge, Skeleton, SectionTitle, BannerWithTag,
│                              #   ResumeCardSkeleton, ResumeBuilderSkeleton,
│                              #   AuthWithSocialForm/, types/
└── vitest-config/src/         # base.ts, react.ts, node.ts
```

## Code Style & Conventions

- **Language**: TypeScript only. Strict mode enabled everywhere.
- **Explicit return types**: Required for all functions (Biome `useExplicitType: "error"`). Exception: Elysia modules/plugins use `biome-ignore` for Eden type inference.
- **Formatting/Linting**: Biome 2.x+ only. 120 char line width, 2-space indent, double quotes, LF endings, sorted Tailwind classes.
- **Naming**: PascalCase for components/types, camelCase for utilities/hooks, `use` prefix for hooks/stores, `Schema` suffix for Zod schemas, `Plugin` suffix for Elysia plugins.
- **Testing**: Vitest 4.x with globals. React Testing Library + jsdom for components. Shared configs via `createReactConfig`/`createNodeConfig`. **Test Co-location**: Tests live in `__tests__` folders next to components: `components/ComponentName.tsx` → `components/__tests__/ComponentName.test.tsx`. Use relative imports (`../ComponentName`) in test files. Aim for 100% coverage on new components.
- **Styling**: Tailwind CSS 4.x only (no inline styles). Mobile-first. Global styles in `packages/ui/global.css`. Use `cn()` for class merging.
- **Git Hooks**: Husky + lint-staged run `biome check --write` on commit.

## API Development

- **Elysia Backend**: Bun-native HTTP framework in `apps/api`
- **Type Safety**: `App` type exported from `app.ts` → consumed by Eden treaty on frontend
- **Modules**: Feature-based with `index.ts` (routes), `service.ts` (business logic), `model.ts` (Zod schemas)
- **Auth**: NextAuth is the authority; Elysia auth plugin forwards cookies to NextAuth session endpoint
- **Error Handling**: Centralized `errorPlugin` with consistent JSON responses (`{ success, data?, error? }`)
- **Validation**: Zod 4.x schemas plugged into Elysia route validation
- **Database**: `prismaPlugin` decorates context with `db` (Prisma client)

## Database Conventions

- **Prisma 7.x**: Schema-first approach with client engine
- **PostgreSQL 18**: Running via Docker (port 5432)
- Table mapping: `@@map("snake_case")` convention
- Run migrations via `packages/database/scripts/migrate-dev.sh`

## Do Not

- Do not use npm, yarn, or pnpm; always use Bun
- Do not add duplicate types/utilities — extend shared packages instead
- Do not hardcode secrets; use environment variables in `.env.local`
- Do not use `any` type; prefer proper typing or `unknown`
- Do not skip tests; maintain comprehensive test coverage
- Do not use inline styles; use Tailwind CSS classes
- Do not create components without proper TypeScript interfaces for props
- Do not hardcode route strings; use `ROUTES` constants from `constants/routing.ts`

## Technology Stack Summary

| Category       | Technology                                                |
| -------------- | --------------------------------------------------------- |
| Frontend       | Next.js 16+, React 19, React Compiler, TypeScript 5.x+   |
| Styling        | Tailwind CSS 4.x (PostCSS)                               |
| Backend        | Elysia 1.x+, Bun 1.x+, TypeScript                       |
| Database       | PostgreSQL 18 with Prisma 7.x ORM                        |
| State          | Zustand 5.x                                              |
| Data Fetching  | TanStack React Query 5.x, Eden (Elysia type-safe client) |
| Rich Text      | TipTap 3.x                                               |
| PDF            | @react-pdf/renderer, jspdf, html2canvas-pro               |
| Drag & Drop    | @dnd-kit/core + @dnd-kit/sortable                        |
| Testing        | Vitest 4.x, React Testing Library                        |
| Build          | Turborepo, Turbopack, Bun                                |
| Code Quality   | Biome 2.x+                                               |
| Git Hooks      | Husky + lint-staged                                      |
| Containerization | Docker, docker-compose                                 |

## MEMORY — Follow these steps for each interaction:

1. Memory Scope:
   - Memory is limited to project-relevant, non-identifying context only
   - Store only: coding preferences, project settings, tool choices, workflow patterns
   - Never store personal identifying information (PII)

2. Memory Retrieval:
   - Always begin your chat by saying only "Remembering..."
   - Retrieve relevant project context when needed for the current task
   - Do not reference personal information about the user

3. Project Context Storage:
   - Coding style preferences (naming conventions, patterns)
   - Frequently used tools and commands
   - Project-specific decisions and conventions
   - Workflow optimizations

4. Privacy Guidelines:
   - Do not collect, store, or reference: age, gender, location, job title, personal relationships
   - Do not create entities for people or personal events
   - Memory must comply with repository privacy guidelines
   - Focus exclusively on technical project context

## Output Rules

- Be concise. Short answers unless detail is requested.
- No verbose explanations, summaries, or recaps unless asked.
- Show code changes, not descriptions of what you'll change.
- Do not ever create documentation files (.md, .txt, .json, etc.) without explicit user request.

---

_This file provides guidance for GitHub Copilot when working with the Rezumer monorepo. Update as project conventions evolve._
