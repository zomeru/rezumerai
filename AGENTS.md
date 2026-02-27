# AI Agent Instructions for Rezumer Monorepo

## Prerequisites

Before anything else, ensure Serena MCP server is activated on this project.

- **Activate Serena** — Call `mcp_serena_activate_project` to activate Serena MCP server on this project every time before you start working.
- **Use Context7** — Use `mcp_context7_query-docs` to get relevant documentation for project library and framework usage, ONLY if needed.

## Agent Skills — Authoritative Skill Directory

All AI agents working in this repository **must** consult `.agents/skills/` as the authoritative source for domain-specific skills before reasoning, planning, or generating code. Each skill folder contains a `SKILL.md` with a description, trigger conditions, rules, and examples.

**Rule**: Before starting any task, list `.agents/skills/` to discover available skills, then read the `SKILL.md` of any that match the task. Do not rely solely on general knowledge when a matching skill exists.

```bash
ls .agents/skills/
```

Once you identify a relevant skill folder, read its `SKILL.md`:

```bash
cat .agents/skills/<skill-name>/SKILL.md
```

## Monorepo Architecture

Rezumer (Rezumerai) is an AI-powered resume builder — a fullstack TypeScript monorepo managed with Turborepo and Bun. It consists of:

- `apps/web`: Next.js 16+ frontend (App Router, React 19, React Compiler, Turbopack, TypeScript, Tailwind CSS 4.x) with embedded Elysia API via catch-all API route
- `packages/database`: Prisma 7.x schema, migration scripts, and DB utilities (PostgreSQL 18)
- `packages/types`: Shared TypeScript types and Zod schemas
- `packages/utils`: Shared utility functions (date, string, styles/cn)
- `packages/ui`: Shared UI components (shadcn/ui based — Button, Badge, Skeleton, etc.)
- `packages/tsconfig`: Shared TypeScript configs (base, next, database, types, ui, utils)

### Key Patterns & Structure

- **Bun workspaces**: All dependency management and scripts use Bun (v1.x+). Never use npm, yarn, or pnpm.
- **predev hook**: `bun run dev` auto-runs `turbo build --filter=@rezumerai/database` first — the database package is always built before the dev server starts.
- **TypeScript everywhere**: Types are centralized in `packages/types` and shared across all apps/packages. Prioritize type safety, readability, and maintainability.
- **Eden treaty**: `apps/web/src/lib/api.ts` creates a type-safe Eden client from the exported `elysiaApp` type in `apps/web/src/elysia-api/app.ts`. The client points to `NEXT_PUBLIC_SITE_URL` (the Next.js app itself), providing end-to-end type safety for all API calls.
- **Routing**: All routes are centralized in `apps/web/src/constants/routing.ts`. Always import and use `ROUTES` constants instead of hardcoding route strings (e.g., use `ROUTES.WORKSPACE` instead of `"/workspace"`).
- **Prisma**: Database schema in `packages/database/prisma/schema.prisma`. Prisma client generated to `packages/database/generated/prisma/`. Uses client engine type.
- **Testing**: Bun test runner (`bun:test`) with Happy DOM for component tests. React tests use `@happy-dom/global-registrator` + React Testing Library. Node tests use the default bun:test environment. Test setup in `src/test/setup.ts` (DOM tests also have `src/test/happydom.ts` as a preload). **Test Organization**: Component tests are co-located with their components in `__tests__` folders (e.g., `components/Badge.tsx` → `components/__tests__/Badge.test.tsx`). Root-level components keep tests in `src/__tests__`.
- **Linting/Formatting**: Biome 2.x+ is the only linter/formatter. Key rules: `useExplicitType: "error"`, `useSortedClasses`, `noUnusedImports: "warn"`, `noUnusedVariables: "error"`.
- **State Management**: Zustand 5.x for client-side state (`useResumeStore`, `useBuilderStore`, `useDashboardStore`).
- **Data Fetching**: TanStack React Query 5.x via `Providers` component with `QueryClientProvider`.
- **Dynamic Routing**: Next.js App Router uses `[resumeId]` folders under `workspace/builder/` and `preview/`.
- **Resume Templates**: 4 templates in `apps/web/src/templates/` — Classic, Modern, Minimal, MinimalImage.
- **Rich Text**: TipTap 3.x for resume content editing.
- **PDF Generation**: `@react-pdf/renderer`, `jspdf`, `html2canvas-pro`.
- **Drag & Drop**: `@dnd-kit/core` + `@dnd-kit/sortable` for section reordering.
- **Shared UI**: Use and extend components in `packages/ui/src/components`.
- **Utilities**: Use helpers from `packages/utils/src` (`formatDate`, `capitalize`, `cn`, `uuid`, React utilities).

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
```

### Database operations

```sh
bun run db:setup       # Push schema and generate Prisma client
bun run db:studio      # Open Prisma Studio (port 5556)
bun run db:reset       # Reset database (destroys data)
cd packages/database && bun run db:seed        # Seed the database
cd packages/database && bun run db:migrate:dev # Run a new migration (dev)
```

### Run with Docker

```sh
bun run docker:build   # Build and start all containers (includes PostgreSQL)
bun run docker:up      # Start containers
bun run docker:down    # Stop containers
```

### Testing

```sh
bun run test           # Run all tests (bun:test)
bun run test:watch     # Run tests in watch mode
bun run test:coverage  # Run tests with coverage
```

### Lint/format

```sh
bun run check          # Run Biome linting with auto-fix
bun run check:types    # Run TypeScript type checking
bun run code:check     # Run both linting and type checking
```

### Build

```sh
bun run build              # Build all packages and apps
bun run build:production   # Production build
bun run code:verify        # Full pre-PR check: lint + types + tests + build
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
│   ├── not-found.tsx      # 404 page
│   ├── globals.css        # Global styles
│   ├── error.tsx          # Segment error boundary
│   ├── global-error.tsx   # Root-level error boundary
│   ├── api/[[...slugs]]/  # Catch-all API route → Elysia app
│   ├── api/auth/[...all]/ # Better Auth handler
│   ├── signin/            # Sign in page (page.tsx, error.tsx)
│   ├── signup/            # Sign up page (page.tsx, error.tsx)
│   ├── workspace/         # Dashboard + builder
│   │   ├── page.tsx       # Dashboard
│   │   ├── layout.tsx     # Workspace layout
│   │   ├── loading.tsx    # Workspace loading state
│   │   ├── error.tsx      # Workspace error boundary
│   │   └── builder/       # Builder routes
│   │       ├── page.tsx   # Builder index
│   │       └── [resumeId]/ # Resume builder (dynamic, page.tsx, loading.tsx, error.tsx)
│   ├── preview/[resumeId]/ # Resume preview (dynamic)
│   └── testsite/          # Test page
├── elysia-api/              # Embedded Elysia API
│   ├── app.ts               # Elysia app (exports type for Eden)
│   ├── plugins/             # auth, prisma, error, logger, csrf
│   │   ├── index.ts         # Barrel exports
│   │   ├── auth.ts          # Validates Better Auth session, injects user
│   │   ├── prisma.ts        # Decorates context with db (Prisma client)
│   │   ├── error.ts         # Centralized error responses
│   │   ├── logger.ts        # Request logging
│   │   └── modernCsrf.ts    # CSRF protection
│   └── modules/             # Feature modules
│       ├── index.ts         # Barrel exports
│       ├── user/            # User CRUD (index.ts, service.ts, model.ts)
│       └── resume/          # Resume CRUD (index.ts, service.ts, model.ts)
├── components/
│   ├── index.tsx          # Barrel exports
│   ├── Home/              # Homepage components
│   ├── Dashboard/         # ActionButtons, BaseModal, CreateResumeModal,
│   │                      #   DownloadResumeModal, EditResumeModal, ResumeCard, UploadResumeModal
│   ├── ResumeBuilder/     # Resume builder (forms, preview, DnD, rich text, PDF, templates, color picker)
│   │   ├── Inputs/        # Form input components
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
│   │   ├── LazyComponents.tsx    # Lazy-loaded component wrappers
│   │   └── LoadingSkeletons.tsx  # Builder loading states
│   ├── Navbar.tsx, Logo.tsx, Loader.tsx
│   ├── ErrorBoundary.tsx
│   ├── SafeComponents.tsx
│   ├── client-date.tsx
│   ├── RouteErrorBoundary.tsx
│   ├── providers.tsx      # QueryClientProvider wrapper
│   └── user-fetcher.tsx
├── hooks/
│   ├── useClickOutside.ts
│   ├── useClientDate.ts
│   ├── useFocusTrap.ts
│   └── usePdfGenerator.ts
├── lib/
│   ├── api.ts             # Eden treaty client
│   ├── auth.ts            # Better Auth config
│   ├── auth-client.ts     # Better Auth client
│   ├── api-client.ts      # API client utilities
│   ├── errors.ts          # Error utilities
│   ├── retry.ts           # Retry logic
│   └── pdfUtils.ts        # PDF utility functions
├── store/
│   ├── useResumeStore.ts   # Resume CRUD state
│   ├── useBuilderStore.ts  # Builder UI state
│   └── useDashboardStore.ts
├── templates/
│   ├── index.tsx          # Templates barrel
│   ├── ClassicTemplate.tsx
│   ├── ModernTemplate.tsx
│   ├── MinimalTemplate.tsx
│   ├── MinimalImageTemplate.tsx
│   ├── HtmlContent.tsx
│   └── types.ts           # TemplateProps, TemplateType
├── constants/
│   ├── routing.ts          # ROUTES constant
│   ├── dummy.ts            # Sample resume data
│   ├── pdf.ts              # PDF constants
│   ├── templates.ts        # Template constants
│   └── index.ts            # APP_NAME, LOGO_TEXT
├── env.ts                 # Environment variable validation
├── proxy.ts               # Proxy configuration
└── test/                  # Test utilities (setup.ts, happydom.ts, utils.tsx)

packages/
├── database/
│   ├── prisma/
│   │   ├── schema.prisma          # Root Prisma schema (PostgreSQL, client engine)
│   │   ├── models/                # Split schema models
│   │   │   ├── resume.prisma      # Resume, Education, Experience, Project, PersonalInformation
│   │   │   └── user.prisma        # User, Account, Session, Verification, SampleTable
│   │   └── migrations/            # Migration history
│   ├── generated/
│   │   ├── prisma/                # Generated Prisma client
│   │   └── prismabox/             # Generated Prismabox Zod schemas (per-model)
│   ├── scripts/seed.ts            # Database seeder
│   ├── dummy-data/resumes.ts      # Dummy resume data for seeding
│   ├── prisma.config.ts           # Prisma config (adapter, migrations path)
│   ├── tsup.config.ts             # tsup bundler config
│   └── index.ts                   # Exports prisma client
├── types/src/
│   ├── index.ts                   # Barrel exports
│   ├── schema.ts                  # Shared Zod schemas / types
│   ├── helpers.ts                 # Type helpers
│   ├── resume/schema.ts           # Resume-specific schemas
│   └── user/schema.ts             # User-specific schemas
├── utils/src/
│   ├── date.ts                # formatDate()
│   ├── string.ts              # capitalize()
│   ├── styles.ts              # cn() class merging
│   ├── uuid.ts                # UUID utilities
│   ├── react.ts               # React utilities
│   └── index.ts               # Barrel exports
├── ui/src/
│   ├── button.tsx             # Button component
│   ├── index.tsx              # Barrel exports
│   └── components/            # Shared components
│       ├── index.tsx          # Components barrel
│       ├── Badge.tsx
│       ├── Skeleton.tsx
│       ├── SectionTitle.tsx
│       ├── BannerWithTag.tsx
│       ├── ResumeBuilderSkeleton.tsx
│       ├── ResumeCardSkeleton.tsx
│       └── AuthWithSocialForm/ # Social auth form (AuthWithSocialForm.tsx, AuthContext.tsx)
```

## Code Style & Conventions

### Language

- TypeScript only. Strict mode enabled everywhere.
- Explicit return types for all functions (Biome `useExplicitType: "error"`).
- Exception: Elysia modules/plugins use `biome-ignore lint/nursery/useExplicitType` for Eden type inference.

### Formatting/Linting (Biome)

- 120 char line width
- Spaces for indentation (2 spaces)
- Double quotes for strings
- LF line endings
- Sorted Tailwind classes (via `useSortedClasses` with `clsx`, `cva`, `cn` functions)
- Auto-organized imports
- Unused imports: warn; Unused variables: error

### Naming Conventions

- **Files**: PascalCase for React components, camelCase for utilities/hooks
- **Components**: PascalCase (`ResumePreview`, `ColorPickerModal`)
- **Hooks**: `use` prefix, camelCase (`useResumeStore`, `usePdfGenerator`)
- **Stores**: `use` prefix + `Store` suffix (`useBuilderStore`)
- **Types/Interfaces**: PascalCase with descriptive names (`TemplateProps`, `SessionUser`)
- **Constants**: SCREAMING_SNAKE_CASE for route constants, camelCase for others
- **API modules**: feature folders with `index.ts`, `service.ts`, `model.ts`
- **Plugins**: camelCase + `Plugin` suffix (`prismaPlugin`, `authPlugin`)
- **Zod schemas**: PascalCase + `Schema` suffix (`CreateUserSchema`)

### TypeScript Best Practices

- Use explicit return types for functions
- Prefer interfaces over types for object shapes
- Use type guards and discriminated unions where appropriate
- Avoid `any` — use `unknown` or proper typing
- Leverage TypeScript utility types (Partial, Pick, Omit, etc.)

### React Best Practices

- Functional components only with TypeScript
- Props interfaces defined explicitly
- React 19 features + React Compiler enabled
- Custom hooks in `apps/web/src/hooks`
- Zustand for client state, React Query for server state
- Component composition over inheritance

### Code Organization

- Modular, readable, and well-documented code
- Single responsibility principle
- Meaningful variable and function names
- JSDoc comments for complex functions and public APIs

### Testing

- Bun test runner (`bun:test`) with `@happy-dom/global-registrator` for component tests
- React Testing Library for component tests; preload `happydom.ts` before `setup.ts` in `bunfig.toml`
- **Test Co-location**: Tests live in `__tests__` folders next to components: `components/ComponentName.tsx` → `components/__tests__/ComponentName.test.tsx`
- Use relative imports (`../ComponentName`) in test files
- Coverage via `bun:test --coverage`
- Path alias `@/` resolves to `./src`
- Aim for 100% coverage on new components

### Styling

- Tailwind CSS 4.x for all styling (no inline styles)
- Mobile-first responsive design
- Global styles in `packages/ui/global.css`
- `cn()` utility for conditional class merging

### Git Hooks

- Husky + lint-staged run `biome check --write` on commit

## API Development

- **Elysia Backend**: Embedded in Next.js via `apps/web/src/elysia-api/`, served through catch-all API route
- **API Routes**: All served through Next.js catch-all route at `app/api/[[...slugs]]/route.ts`
- **Type Safety**: `elysiaApp` type exported from `elysia-api/app.ts` → consumed by Eden treaty on frontend
- **Modules**: Feature-based structure with `index.ts` (routes), `service.ts` (business logic), `model.ts` (Zod schemas)
- **Auth**: Better Auth is the authority; Elysia auth plugin forwards cookies to Better Auth session endpoint
- **Error Handling**: Centralized `errorPlugin` with consistent JSON responses (`{ success, data?, error? }`)
- **Validation**: Zod 4.x schemas plugged directly into Elysia route validation
- **Database Access**: `prismaPlugin` decorates context with `db` (Prisma client)
- **Logging**: `loggerPlugin` logs method, path, status, duration for every request
- **Health Check**: `GET /api/health` returns server status with timestamp

## Database Conventions

- **Prisma 7.x**: Schema-first approach with client engine
- **PostgreSQL 18**: Running via Docker (port 5432)
- **PrismaPg adapter**: Uses `@prisma/adapter-pg` with native pg driver
- Generated client output: `packages/database/generated/prisma/`
- Singleton pattern: global reference survives hot reloads in dev
- Run migrations via `cd packages/database && bun run db:migrate:dev`
- Use Prisma Client types in application code
- Table mapping uses `@@map("snake_case")` convention

## Do Not

- Do not use npm, yarn, or pnpm; always use Bun
- Do not add duplicate types/utilities — extend shared packages instead
- Do not hardcode secrets; use environment variables in `.env.local`
- Do not use `any` type; prefer proper typing or `unknown`
- Do not skip tests; maintain comprehensive test coverage
- Do not use inline styles; use Tailwind CSS classes
- Do not create components without proper TypeScript interfaces for props
- Do not hardcode route strings; use `ROUTES` constants from `constants/routing.ts`

## Claude-Specific Guidelines

When assisting with this codebase:

1. **Always use TypeScript** syntax and conventions
2. **Provide complete, production-ready code** with proper types and explicit return types
3. **Include JSDoc comments** for complex functions
4. **Suggest tests** alongside implementation when relevant
5. **Consider UI/UX implications** when working on frontend features
6. **Recommend best practices** for maintainability and scalability
7. **Flag potential issues** with type safety, performance, or accessibility
8. **Suggest modern patterns** using React 19, Next.js 16+, and latest TypeScript features
9. **Use Biome-compatible style** — double quotes, 120 char width, sorted Tailwind classes

## Technology Stack Summary

| Category       | Technology                                                |
| -------------- | --------------------------------------------------------- |
| Frontend       | Next.js 16+, React 19, React Compiler, TypeScript 5.x+   |
| Styling        | Tailwind CSS 4.x (PostCSS)                               |
| Backend        | Elysia 1.x+ (embedded in Next.js), Bun 1.x+, TypeScript  |
| Database       | PostgreSQL 18 with Prisma 7.x ORM                        |
| State          | Zustand 5.x                                              |
| Data Fetching  | TanStack React Query 5.x, Eden (Elysia type-safe client) |
| Rich Text      | TipTap 3.x                                               |
| PDF            | @react-pdf/renderer, jspdf, html2canvas-pro               |
| Drag & Drop    | @dnd-kit/core + @dnd-kit/sortable                        |
| Testing        | Bun Test, React Testing Library                          |
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

_This file provides guidance for AI assistant when working with the Rezumer monorepo. Update as project conventions evolve._
