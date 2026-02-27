# Monorepo Setup

## When to Use a Monorepo

| Use Monorepo When | Stay Single Repo When |
|-------------------|----------------------|
| Multiple apps share code | Single application |
| Multiple teams need shared packages | Small team, single project |
| Consistent tooling across projects | No code sharing needed |
| Atomic changes across packages | Independent release cycles |

## Turborepo Setup

### Installation

```bash
npx create-turbo@latest
# Or add to existing project
npm install turbo --save-dev
```

### Project Structure

```
my-monorepo/
├── apps/
│   ├── web/                    # Main Next.js app
│   │   ├── app/
│   │   ├── package.json
│   │   └── next.config.ts
│   ├── admin/                  # Admin Next.js app
│   │   ├── app/
│   │   ├── package.json
│   │   └── next.config.ts
│   └── docs/                   # Documentation site
│       └── package.json
├── packages/
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── config/                 # Shared configs
│   │   ├── eslint/
│   │   ├── typescript/
│   │   └── tailwind/
│   ├── database/               # Shared database client
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   └── schema.ts
│   │   └── package.json
│   └── utils/                  # Shared utilities
│       ├── src/
│       └── package.json
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

### Root package.json

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "lint": "turbo lint",
    "test": "turbo test",
    "clean": "turbo clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md}\""
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.0.0"
  },
  "packageManager": "pnpm@8.0.0"
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

## Shared UI Package

### package.json

```json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./button": "./src/button.tsx",
    "./input": "./src/input.tsx",
    "./card": "./src/card.tsx"
  },
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx",
    "generate:component": "turbo gen react-component"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  },
  "devDependencies": {
    "@repo/config-typescript": "workspace:*",
    "@repo/config-eslint": "workspace:*",
    "typescript": "^5.0.0"
  }
}
```

### Component Example

```typescript
// packages/ui/src/button.tsx
import { forwardRef, ButtonHTMLAttributes } from "react"
import { cn } from "./utils"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "ghost"
  size?: "sm" | "default" | "lg"
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2",
          "disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90":
              variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90":
              variant === "destructive",
            "border border-input bg-background hover:bg-accent":
              variant === "outline",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
          },
          {
            "h-9 px-3 text-sm": size === "sm",
            "h-10 px-4 py-2": size === "default",
            "h-11 px-8 text-lg": size === "lg",
          },
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"
```

### Barrel Export

```typescript
// packages/ui/src/index.ts
export * from "./button"
export * from "./input"
export * from "./card"
export * from "./utils"
```

## Shared Database Package

```typescript
// packages/database/src/client.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db

// packages/database/package.json
{
  "name": "@repo/database",
  "version": "0.0.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./client": "./src/client.ts"
  },
  "scripts": {
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0"
  }
}
```

## Shared Config Packages

### TypeScript Config

```json
// packages/config-typescript/base.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true
  }
}

// packages/config-typescript/nextjs.json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "noEmit": true,
    "module": "esnext",
    "jsx": "preserve",
    "plugins": [{ "name": "next" }]
  }
}
```

### ESLint Config

```javascript
// packages/config-eslint/next.js
module.exports = {
  extends: [
    "next/core-web-vitals",
    "prettier",
  ],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-key": "error",
  },
}
```

### Tailwind Config

```typescript
// packages/config-tailwind/tailwind.config.ts
import type { Config } from "tailwindcss"

const config: Partial<Config> = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          500: "#0ea5e9",
          900: "#0c4a6e",
        },
      },
    },
  },
}

export default config
```

## App Configuration

### Next.js App package.json

```json
{
  "name": "@repo/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@repo/ui": "workspace:*",
    "@repo/database": "workspace:*",
    "@repo/utils": "workspace:*",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@repo/config-typescript": "workspace:*",
    "@repo/config-eslint": "workspace:*",
    "@repo/config-tailwind": "workspace:*"
  }
}
```

### tsconfig.json in App

```json
{
  "extends": "@repo/config-typescript/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Using Shared Packages

```typescript
// apps/web/app/page.tsx
import { Button, Card } from "@repo/ui"
import { db } from "@repo/database/client"
import { formatDate } from "@repo/utils"

export default async function Page() {
  const posts = await db.post.findMany()

  return (
    <div>
      {posts.map((post) => (
        <Card key={post.id}>
          <h2>{post.title}</h2>
          <p>{formatDate(post.createdAt)}</p>
          <Button>Read More</Button>
        </Card>
      ))}
    </div>
  )
}
```

## Turborepo Features

### Remote Caching

```bash
# Login to Vercel
npx turbo login

# Link to remote cache
npx turbo link

# Or use environment variable
TURBO_TOKEN=xxx
TURBO_TEAM=my-team
```

### Filtering

```bash
# Build only web app
turbo build --filter=@repo/web

# Build app and its dependencies
turbo build --filter=@repo/web...

# Build everything that depends on ui
turbo build --filter=...@repo/ui

# Build changed packages since main
turbo build --filter=[main]
```

### Environment Variables

```json
// turbo.json
{
  "tasks": {
    "build": {
      "env": ["DATABASE_URL", "NEXTAUTH_SECRET"],
      "passThroughEnv": ["CI", "VERCEL"]
    }
  }
}
```

## CI/CD for Monorepo

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Lint
        run: pnpm lint

      - name: Test
        run: pnpm test
```

### Vercel Deployment

```json
// apps/web/vercel.json
{
  "framework": "nextjs",
  "installCommand": "pnpm install",
  "buildCommand": "cd ../.. && turbo build --filter=@repo/web"
}
```

## Code Generation

### Turborepo Generators

```typescript
// turbo/generators/config.ts
import type { PlopTypes } from "@turbo/gen"

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  plop.setGenerator("react-component", {
    description: "Add a new React component",
    prompts: [
      {
        type: "input",
        name: "name",
        message: "Component name:",
      },
      {
        type: "list",
        name: "package",
        message: "Which package?",
        choices: ["ui", "web", "admin"],
      },
    ],
    actions: [
      {
        type: "add",
        path: "packages/{{package}}/src/{{kebabCase name}}.tsx",
        templateFile: "templates/component.tsx.hbs",
      },
    ],
  })
}
```

### Run Generator

```bash
turbo gen react-component
```

## Best Practices

| Practice | Description |
|----------|-------------|
| Keep packages focused | One responsibility per package |
| Use workspace protocol | `"@repo/ui": "workspace:*"` |
| Share configs | TypeScript, ESLint, Tailwind |
| Use remote caching | Speed up CI/CD |
| Filter in CI | Only build what changed |
| Version together | Or use changesets for versioning |

## Monorepo Checklist

- [ ] pnpm or npm workspaces configured
- [ ] turbo.json with proper task dependencies
- [ ] Shared packages have proper exports
- [ ] TypeScript paths configured
- [ ] ESLint config shared
- [ ] Tailwind config includes package paths
- [ ] Remote caching enabled
- [ ] CI filters to changed packages
- [ ] Each app can build independently
- [ ] Documentation for adding new packages
