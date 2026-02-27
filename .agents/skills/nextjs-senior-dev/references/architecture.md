# Project Architecture & Organization

## Feature-Sliced Architecture

For large-scale Next.js apps (50+ routes, multiple teams), use domain-driven organization.

### Recommended Structure

```
src/
├── app/                          # ROUTING LAYER ONLY
│   ├── (marketing)/              # Route Group: Public pages
│   │   ├── page.tsx              # Landing /
│   │   ├── pricing/page.tsx      # /pricing
│   │   └── layout.tsx
│   ├── (app)/                    # Route Group: Authenticated
│   │   ├── layout.tsx            # Auth check, app shell
│   │   ├── dashboard/
│   │   │   ├── _components/      # Route-specific (private)
│   │   │   │   └── StatsCard.tsx
│   │   │   ├── _actions/         # Route-specific actions
│   │   │   │   └── refresh.ts
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   └── error.tsx
│   │   └── settings/
│   │       └── [[...tab]]/       # Optional catch-all
│   │           └── page.tsx
│   ├── api/                      # External APIs only
│   │   ├── webhooks/
│   │   │   └── stripe/route.ts
│   │   └── v1/                   # Versioned APIs
│   │       └── users/route.ts
│   ├── layout.tsx                # Root layout
│   └── global-error.tsx          # Fatal error boundary
│
├── components/                   # GLOBAL SHARED UI
│   ├── ui/                       # Primitives (Button, Input, Card)
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── index.ts              # Barrel export OK here
│   └── shared/                   # Compounds (Navbar, Footer, Modal)
│       ├── navbar/
│       │   ├── Navbar.tsx
│       │   ├── NavItem.tsx
│       │   └── index.ts
│       └── footer/
│
├── features/                     # BUSINESS LOGIC (Core)
│   ├── auth/
│   │   ├── components/           # Feature-specific UI
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── actions/              # Server Actions
│   │   │   ├── login.ts
│   │   │   └── logout.ts
│   │   ├── queries/              # Data fetching
│   │   │   └── get-user.ts
│   │   ├── hooks/
│   │   │   └── use-session.ts
│   │   ├── lib/                  # Feature utilities
│   │   │   └── jwt.ts
│   │   └── types.ts
│   ├── billing/
│   ├── projects/
│   └── teams/
│
├── lib/                          # GLOBAL UTILITIES
│   ├── db/                       # Database client
│   │   ├── client.ts
│   │   ├── schema.ts
│   │   └── migrations/
│   ├── auth/                     # Auth utilities
│   │   └── session.ts
│   ├── api/                      # Fetch wrappers
│   │   └── client.ts
│   ├── utils/                    # Pure utilities
│   │   ├── cn.ts                 # Class merge
│   │   ├── format.ts
│   │   └── validation.ts
│   └── safe-action.ts            # Secure action builder
│
├── config/                       # Configuration
│   ├── site.ts                   # Site metadata
│   ├── navigation.ts             # Nav items
│   └── env.ts                    # Validated env vars
│
├── types/                        # GLOBAL TYPES
│   ├── api.ts
│   ├── database.ts
│   └── index.ts
│
└── styles/
    ├── globals.css
    └── fonts/
```

## Key Principles

### 1. Colocation

Keep things that change together, close together.

| Scope | Location | Example |
|-------|----------|---------|
| Route-specific | `app/[route]/_components/` | Dashboard widgets |
| Feature-wide | `features/[feature]/components/` | Auth forms |
| App-wide | `components/ui/` or `shared/` | Buttons, Navbar |

### 2. Private Folders (`_` prefix)

```
app/dashboard/
├── _components/     # NOT a route, NOT exported
│   └── Widget.tsx
├── _actions/        # Route-specific Server Actions
│   └── update.ts
└── page.tsx         # Uses _components internally
```

### 3. Route Groups (`(name)`)

Organize without affecting URL:

```
app/
├── (marketing)/     # URL: /
│   ├── layout.tsx   # No auth, marketing header
│   └── page.tsx
├── (app)/           # URL: /dashboard (not /app/dashboard)
│   ├── layout.tsx   # Auth required, app shell
│   └── dashboard/
└── (admin)/         # URL: /admin
    └── layout.tsx   # Admin-only layout
```

### 4. Feature Module Structure

Each feature is self-contained:

```
features/billing/
├── components/          # UI components
│   ├── PricingTable.tsx
│   ├── InvoiceList.tsx
│   └── PaymentForm.interactive.tsx
├── actions/             # Server Actions
│   ├── create-subscription.ts
│   ├── cancel-subscription.ts
│   └── update-payment.ts
├── queries/             # Data fetching functions
│   ├── get-subscription.ts
│   ├── get-invoices.ts
│   └── get-usage.ts
├── hooks/               # Client hooks
│   └── use-subscription.ts
├── lib/                 # Feature utilities
│   ├── stripe.ts
│   └── calculate-price.ts
├── types.ts             # Feature types
└── constants.ts         # Feature constants
```

## Import Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/features/*": ["./src/features/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  }
}
```

## Import Rules

| From | Can Import |
|------|-----------|
| `app/` | `@/features/*`, `@/components/*`, `@/lib/*` |
| `features/` | `@/components/ui/*`, `@/lib/*`, own feature |
| `components/` | `@/lib/*`, other components |
| `lib/` | Only other `lib/`, `types/` |

### DON'T

```typescript
// features/auth/components/LoginForm.tsx
import { ProjectCard } from "@/features/projects/components" // ❌ Cross-feature
```

### DO

```typescript
// features/auth/components/LoginForm.tsx
import { Button } from "@/components/ui" // ✅ Shared UI
import { validateEmail } from "@/lib/utils" // ✅ Shared utility
```

## Barrel Exports Strategy

| Location | Barrel Export? | Reason |
|----------|---------------|--------|
| `components/ui/` | ✅ Yes | Stable, frequently imported |
| `components/shared/` | ✅ Yes | Stable compounds |
| `features/*/` | ❌ No | Explicit paths are clearer |
| `lib/` | ⚠️ Selective | Only for related utils |

```typescript
// components/ui/index.ts - OK
export { Button } from "./button"
export { Input } from "./input"

// features/auth/index.ts - AVOID
// Use explicit: import { login } from "@/features/auth/actions/login"
```

## Environment Configuration

### Validated Environment Variables

```typescript
// config/env.ts
import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  // Public (exposed to client)
  NEXT_PUBLIC_APP_URL: z.string().url(),
})

// Validate at build time
export const env = envSchema.parse(process.env)

// Type-safe access
export type Env = z.infer<typeof envSchema>
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Page | `page.tsx` | - |
| Layout | `layout.tsx` | - |
| Server Component | `PascalCase.tsx` | `UserProfile.tsx` |
| Client Component | `*.interactive.tsx` | `Counter.interactive.tsx` |
| Server Action | `kebab-case.ts` | `create-post.ts` |
| Utility | `kebab-case.ts` | `format-date.ts` |
| Hook | `use-*.ts` | `use-session.ts` |
| Types | `types.ts` or `*.types.ts` | `user.types.ts` |
| Constants | `constants.ts` | - |

## Scale Considerations

### Small Project (<20 routes)

```
src/
├── app/
├── components/
├── lib/
└── types/
```

### Medium Project (20-50 routes)

```
src/
├── app/
├── components/
│   ├── ui/
│   └── shared/
├── lib/
├── hooks/
└── types/
```

### Large Project (50+ routes)

Full feature-sliced architecture (see above).

### Enterprise (100+ routes, multiple teams)

Consider:
- Monorepo (Turborepo)
- Shared packages (`@company/ui`, `@company/utils`)
- Feature flags for team isolation
- Separate deployments per domain