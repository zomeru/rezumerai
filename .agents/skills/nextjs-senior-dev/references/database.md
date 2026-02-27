# Database Patterns

## Prisma Setup

### Installation & Configuration

```bash
npm install prisma @prisma/client
npx prisma init
```

```typescript
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
  @@index([published])
}
```

### Singleton Pattern for Prisma Client

```typescript
// lib/db/client.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
```

### Connection Pooling (Serverless)

```typescript
// For serverless environments (Vercel, AWS Lambda)
// Use connection pooling with PgBouncer or Prisma Accelerate

// prisma/schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL") // For migrations
}

// .env
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=..."
DIRECT_DATABASE_URL="postgresql://user:pass@host:5432/db"
```

## Drizzle ORM Alternative

### Setup

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

```typescript
// lib/db/schema.ts
import { pgTable, text, timestamp, boolean, index } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    email: text("email").notNull().unique(),
    name: text("name"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
  })
)

export const posts = pgTable(
  "posts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    title: text("title").notNull(),
    content: text("content"),
    published: boolean("published").default(false).notNull(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    authorIdx: index("author_idx").on(table.authorId),
    publishedIdx: index("published_idx").on(table.published),
  })
)
```

```typescript
// lib/db/client.ts
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL!

// For serverless: connection pooling
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })
```

## Query Patterns

### Server Component Queries

```typescript
// features/posts/queries/get-posts.ts
import { cache } from "react"
import { db } from "@/lib/db/client"

// Memoized per request (deduplication)
export const getPosts = cache(async (published = true) => {
  return db.post.findMany({
    where: { published },
    include: { author: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })
})

// With pagination
export const getPostsPaginated = cache(
  async (page = 1, limit = 10, published = true) => {
    const [posts, total] = await Promise.all([
      db.post.findMany({
        where: { published },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      db.post.count({ where: { published } }),
    ])

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }
)
```

### N+1 Prevention

```typescript
// WRONG: N+1 query problem
async function getPostsWithAuthors() {
  const posts = await db.post.findMany()

  // Each iteration triggers a query!
  return Promise.all(
    posts.map(async (post) => ({
      ...post,
      author: await db.user.findUnique({ where: { id: post.authorId } }),
    }))
  )
}

// RIGHT: Include related data
async function getPostsWithAuthors() {
  return db.post.findMany({
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  })
}

// RIGHT: Batch query with findMany
async function getPostsWithAuthors() {
  const posts = await db.post.findMany()
  const authorIds = [...new Set(posts.map((p) => p.authorId))]

  const authors = await db.user.findMany({
    where: { id: { in: authorIds } },
  })

  const authorMap = new Map(authors.map((a) => [a.id, a]))

  return posts.map((post) => ({
    ...post,
    author: authorMap.get(post.authorId),
  }))
}
```

### Transactions

```typescript
// features/orders/actions/create-order.ts
"use server"

import { db } from "@/lib/db/client"

export async function createOrder(userId: string, items: CartItem[]) {
  return db.$transaction(async (tx) => {
    // 1. Create order
    const order = await tx.order.create({
      data: {
        userId,
        status: "PENDING",
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      },
    })

    // 2. Create order items
    await tx.orderItem.createMany({
      data: items.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    })

    // 3. Update inventory
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
        },
      })
    }

    // 4. Clear cart
    await tx.cartItem.deleteMany({
      where: { userId },
    })

    return order
  })
}
```

### Optimistic Locking

```typescript
// Prevent race conditions with version field
model Product {
  id      String @id
  name    String
  stock   Int
  version Int    @default(0)
}

// Update with version check
async function decrementStock(productId: string, quantity: number) {
  const product = await db.product.findUnique({
    where: { id: productId },
  })

  if (!product || product.stock < quantity) {
    throw new Error("Insufficient stock")
  }

  const updated = await db.product.updateMany({
    where: {
      id: productId,
      version: product.version, // Optimistic lock
    },
    data: {
      stock: { decrement: quantity },
      version: { increment: 1 },
    },
  })

  if (updated.count === 0) {
    throw new Error("Concurrent modification detected")
  }
}
```

## Migrations

### Prisma Migrations

```bash
# Create migration
npx prisma migrate dev --name add_posts_table

# Apply in production
npx prisma migrate deploy

# Reset database (dev only!)
npx prisma migrate reset
```

### Migration Best Practices

```typescript
// Safe migrations - add columns as nullable first
model User {
  id    String  @id
  email String  @unique
  phone String? // Add as nullable
}

// Then backfill data, then make required if needed
```

### Zero-Downtime Migrations

| Step | Action | Safe? |
|------|--------|-------|
| 1 | Add new column (nullable) | Yes |
| 2 | Deploy code that writes to both | Yes |
| 3 | Backfill data | Yes |
| 4 | Deploy code that reads new column | Yes |
| 5 | Add NOT NULL constraint | Yes |
| 6 | Remove old column reads | Yes |
| 7 | Drop old column | Yes |

## Soft Deletes

```typescript
// prisma/schema.prisma
model Post {
  id        String    @id
  title     String
  deletedAt DateTime? // Soft delete marker

  @@index([deletedAt])
}

// Middleware for automatic filtering
// lib/db/client.ts
const prisma = new PrismaClient().$extends({
  query: {
    post: {
      async findMany({ args, query }) {
        args.where = { ...args.where, deletedAt: null }
        return query(args)
      },
      async findFirst({ args, query }) {
        args.where = { ...args.where, deletedAt: null }
        return query(args)
      },
    },
  },
})

// Soft delete function
async function softDelete(id: string) {
  return db.post.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}
```

## Database Seeding

```typescript
// prisma/seed.ts
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Clear existing data (dev only)
  await prisma.post.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const user = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      posts: {
        create: [
          { title: "First Post", content: "Hello World", published: true },
          { title: "Draft Post", content: "Work in progress" },
        ],
      },
    },
  })

  console.log("Seeded:", { user })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

```json
// package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## Query Performance

### Indexing Strategy

```typescript
// Add indexes for:
// 1. Foreign keys (automatic in some DBs)
// 2. Frequently filtered columns
// 3. Sorted columns
// 4. Unique constraints

model Post {
  id        String @id
  authorId  String
  status    String
  createdAt DateTime

  @@index([authorId])              // FK lookup
  @@index([status])                // Filter by status
  @@index([createdAt(sort: Desc)]) // Order by date
  @@index([authorId, status])      // Compound for both
}
```

### Query Optimization

```typescript
// Select only needed fields
const users = await db.user.findMany({
  select: {
    id: true,
    name: true,
    // Don't select large fields if not needed
  },
})

// Use cursor pagination for large datasets
const posts = await db.post.findMany({
  take: 10,
  skip: 1, // Skip the cursor
  cursor: { id: lastPostId },
  orderBy: { createdAt: "desc" },
})

// Batch operations
await db.post.updateMany({
  where: { authorId: userId },
  data: { published: false },
})
```

## Caching with Database

```typescript
// features/posts/queries/get-post.ts
import { unstable_cache } from "next/cache"
import { db } from "@/lib/db/client"

export const getPost = unstable_cache(
  async (id: string) => {
    return db.post.findUnique({
      where: { id },
      include: { author: true },
    })
  },
  ["post"],
  {
    tags: ["posts"],
    revalidate: 60, // 1 minute
  }
)

// Invalidate on mutation
"use server"
import { revalidateTag } from "next/cache"

export async function updatePost(id: string, data: UpdatePostInput) {
  await db.post.update({ where: { id }, data })
  revalidateTag("posts")
}
```

## Error Handling

```typescript
// lib/db/errors.ts
import { Prisma } from "@prisma/client"

export function handleDatabaseError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        throw new Error("A record with this value already exists")
      case "P2025":
        throw new Error("Record not found")
      case "P2003":
        throw new Error("Related record not found")
      default:
        throw new Error("Database error")
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    throw new Error("Invalid data provided")
  }

  throw error
}

// Usage in actions
export async function createUser(data: CreateUserInput) {
  try {
    return await db.user.create({ data })
  } catch (error) {
    handleDatabaseError(error)
  }
}
```

## Database Comparison

| Feature | Prisma | Drizzle |
|---------|--------|---------|
| Type Safety | Excellent | Excellent |
| Bundle Size | Larger | Smaller |
| Learning Curve | Easier | Steeper |
| Raw SQL | Limited | Native |
| Migrations | Built-in | Built-in |
| Relations | Declarative | SQL-like |
| Performance | Good | Better |
| Edge Runtime | Via Accelerate | Native |
