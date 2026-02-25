# Resume Module Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the Resume CRUD API (GET/:id, PATCH/:id, DELETE/:id) and wire up all frontend actions to real endpoints.

**Architecture:** Single unified PATCH endpoint handles scalar fields + relation arrays in one Prisma `$transaction`. Frontend store gains async delete and addResume; Dashboard and Builder call real API. Naming fix: `projects` → `project` in ResumeSchema aligns types with Prisma.

**Tech Stack:** Elysia 1.x (routes), Prisma 7.x (`$transaction`, `findFirst`, `deleteMany`), Zod 4.x (schemas), Zustand 5.x (store), Eden treaty (type-safe client), Bun test + bun:test mocks.

---

## Reference

Key files to understand before starting:
- `packages/types/src/resume/schema.ts` — all Zod schemas and types
- `apps/web/src/elysia-api/modules/resume/service.ts` — existing service (partial)
- `apps/web/src/elysia-api/modules/resume/index.ts` — existing routes (GET /, POST /)
- `apps/web/src/elysia-api/modules/resume/model.ts` — Elysia model registry
- `apps/web/src/store/useResumeStore.ts` — Zustand resume store
- `apps/web/src/app/workspace/page.tsx` — Dashboard (handlers to wire)
- `apps/web/src/app/workspace/builder/[resumeId]/page.tsx` — Builder (save to wire)
- `apps/web/src/elysia-api/modules/user/index.ts` — pattern reference for routes

Biome rules to follow (will fail `bun run biome` otherwise):
- Double quotes everywhere
- Explicit return types on all functions (`useExplicitType: "error"`)
- Exception: Elysia route handlers use `// biome-ignore lint/nursery/useExplicitType: Eden inference`
- No unused variables

---

## Task 1: Fix ResumeSchema — rename `projects` → `project`, remove `user` from ResumeWithRelations, add update schemas

**Files:**
- Modify: `packages/types/src/resume/schema.ts`

**Context:**
- `ResumeSchema` currently has `projects: ProjectSchema` but Prisma, templates, builder all use `project` (singular). This causes TypeScript errors in the builder page.
- `ResumeWithRelations` currently includes the `user` relation — remove it so the type is assignable to `ResumeResponse[]` in the store without casting.
- Add `ResumeUpdateBodySchema` and `ResumeUpdateBody` type for the PATCH endpoint.

**Step 1: Edit `packages/types/src/resume/schema.ts`**

Make these three changes:

1a. In `ResumeSchema`, rename `projects` → `project`:
```typescript
// BEFORE:
export const ResumeSchema = ResumeObjectSchema.extend({
  personalInfo: PersonalInformationSchema.nullable(),
  experience: ExperienceSchema,
  education: EducationSchema,
  projects: ProjectSchema,   // <-- change this
})

// AFTER:
export const ResumeSchema = ResumeObjectSchema.extend({
  personalInfo: PersonalInformationSchema.nullable(),
  experience: ExperienceSchema,
  education: EducationSchema,
  project: ProjectSchema,    // <-- singular, matches Prisma
})
```

1b. Update `ResumeWithRelations` to omit `user`:
```typescript
// BEFORE:
export type ResumeWithRelations = Prisma.ResumeGetPayload<{
  include: {
    education: true;
    experience: true;
    project: true;
    personalInfo: true;
    user: true;
  };
}>;

// AFTER:
export type ResumeWithRelations = Prisma.ResumeGetPayload<{
  include: {
    education: true;
    experience: true;
    project: true;
    personalInfo: true;
  };
}>;
```

1c. Add the update schemas and types. Append after the existing `ProjectInputUpdate` type (near line 237):

```typescript
// ── Update schemas for PATCH /resumes/:id ─────────────────────────────────

/** Scalar resume fields for partial update (no id, userId, or timestamps) */
export const ResumeScalarUpdateSchema = ResumeObjectSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).partial();

/** Experience item for update — id is optional (omit for new items) */
export const ExperienceUpdateItemSchema = ExperienceItemSchema.omit({
  resumeId: true,
}).extend({ id: z.string().optional() });

/** Education item for update — id is optional (omit for new items) */
export const EducationUpdateItemSchema = EducationItemSchema.omit({
  resumeId: true,
}).extend({ id: z.string().optional() });

/** Project item for update — id is optional (omit for new items) */
export const ProjectUpdateItemSchema = ProjectItemSchema.omit({
  resumeId: true,
}).extend({ id: z.string().optional() });

/** Full PATCH body: any scalar fields + optional relation arrays */
export const ResumeUpdateBodySchema = ResumeScalarUpdateSchema.extend({
  personalInfo: PersonalInfoInputCreate.partial().optional(),
  experience: z.array(ExperienceUpdateItemSchema).optional(),
  education: z.array(EducationUpdateItemSchema).optional(),
  project: z.array(ProjectUpdateItemSchema).optional(),
});

export type ResumeUpdateBody = z.infer<typeof ResumeUpdateBodySchema>;
export type ExperienceUpdateItem = z.infer<typeof ExperienceUpdateItemSchema>;
export type EducationUpdateItem = z.infer<typeof EducationUpdateItemSchema>;
export type ProjectUpdateItem = z.infer<typeof ProjectUpdateItemSchema>;
```

**Step 2: Verify the types package builds**

```bash
cd /path/to/rezumerai
bun run --filter=types build
```

Expected: no errors.

**Step 3: Commit**

```bash
git add packages/types/src/resume/schema.ts
git commit -m "fix(types): rename projects→project in ResumeSchema, add update body schema"
```

---

## Task 2: Update Elysia model registry

**Files:**
- Modify: `apps/web/src/elysia-api/modules/resume/model.ts`

**Context:** Elysia uses `.model()` to register named schemas for route validation. We need `resume.byIdParams` (for `:id` param validation) and `resume.update` (for PATCH body).

**Step 1: Replace the file content**

```typescript
import { ResumeUpdateBodySchema } from "@rezumerai/types/index.mjs";
import { FullResumeInputCreate } from "@rezumerai/types/index.mjs";
import { t } from "elysia";

// ── Resume models ──────────────────────────────────────────────────────────────

/** Model group for Elysia `.model()` registration — reference schemas by name in route validation. */
export const ResumeModels = {
  "resume.create": FullResumeInputCreate,
  "resume.update": ResumeUpdateBodySchema,
  "resume.byIdParams": t.Object({ id: t.String() }),
} as const;
```

**Step 2: Verify no biome errors**

```bash
cd apps/web && bun run biome check src/elysia-api/modules/resume/model.ts
```

Expected: no errors.

**Step 3: Commit**

```bash
git add apps/web/src/elysia-api/modules/resume/model.ts
git commit -m "feat(resume): add byIdParams and update models"
```

---

## Task 3: Service — add `findById`

**Files:**
- Create: `apps/web/src/elysia-api/modules/resume/__tests__/service.test.ts`
- Modify: `apps/web/src/elysia-api/modules/resume/service.ts`

**Context:** `findById` uses `db.resume.findFirst` with both `id` and `userId` conditions (not `findUnique` — Prisma's `findUnique` only accepts unique/PK fields). Returns `null` if not found or not owned.

**Step 1: Create test file and write failing test**

```typescript
// apps/web/src/elysia-api/modules/resume/__tests__/service.test.ts
import { describe, expect, it, mock, beforeEach } from "bun:test";
import type { PrismaClient } from "@rezumerai/database";
import { ResumeService } from "../service";

// Minimal mock for Prisma — only mock what each test uses
function makeMockDb(overrides: Partial<Record<string, unknown>> = {}): PrismaClient {
  return {
    resume: {
      findFirst: mock(),
      findMany: mock(),
      update: mock(),
      deleteMany: mock(),
      create: mock(),
    },
    personalInformation: { upsert: mock() },
    experience: { findMany: mock(), update: mock(), create: mock(), deleteMany: mock() },
    education: { findMany: mock(), update: mock(), create: mock(), deleteMany: mock() },
    project: { findMany: mock(), update: mock(), create: mock(), deleteMany: mock() },
    $transaction: mock((fn: (tx: unknown) => unknown) => fn({
      resume: { update: mock(), findUniqueOrThrow: mock() },
      personalInformation: { upsert: mock() },
      experience: { findMany: mock().mockResolvedValue([]), update: mock(), create: mock(), deleteMany: mock() },
      education: { findMany: mock().mockResolvedValue([]), update: mock(), create: mock(), deleteMany: mock() },
      project: { findMany: mock().mockResolvedValue([]), update: mock(), create: mock(), deleteMany: mock() },
    })),
    ...overrides,
  } as unknown as PrismaClient;
}

const RESUME_ID = "resume_123";
const USER_ID = "user_456";

const RESUME_WITH_RELATIONS = {
  id: RESUME_ID,
  userId: USER_ID,
  title: "My Resume",
  public: false,
  professionalSummary: "",
  template: "classic",
  accentColor: "#000000",
  fontSize: "medium",
  customFontSize: 1,
  skills: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  personalInfo: null,
  experience: [],
  education: [],
  project: [],
};

describe("ResumeService.findById", () => {
  it("returns the resume when found and owned by user", async () => {
    const db = makeMockDb();
    (db.resume.findFirst as ReturnType<typeof mock>).mockResolvedValue(RESUME_WITH_RELATIONS);

    const result = await ResumeService.findById(db, USER_ID, RESUME_ID);

    expect(result).toEqual(RESUME_WITH_RELATIONS);
    expect(db.resume.findFirst).toHaveBeenCalledWith({
      where: { id: RESUME_ID, userId: USER_ID },
      include: {
        education: true,
        experience: true,
        project: true,
        personalInfo: true,
      },
    });
  });

  it("returns null when resume not found", async () => {
    const db = makeMockDb();
    (db.resume.findFirst as ReturnType<typeof mock>).mockResolvedValue(null);

    const result = await ResumeService.findById(db, USER_ID, RESUME_ID);

    expect(result).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd apps/web && bun test src/elysia-api/modules/resume/__tests__/service.test.ts
```

Expected: FAIL — `ResumeService.findById is not a function`

**Step 3: Add `findById` to service**

In `apps/web/src/elysia-api/modules/resume/service.ts`, add after the `findAll` method:

```typescript
/**
 * Finds a single resume by ID, scoped to the authenticated user.
 *
 * @param db - Prisma client instance
 * @param userId - ID of the authenticated user (ownership check)
 * @param resumeId - ID of the resume to retrieve
 * @returns Resume with all relations, or null if not found / not owned
 */
static async findById(
  db: PrismaClient,
  userId: string,
  resumeId: string,
): Promise<ResumeWithRelations | null> {
  const resume = await db.resume.findFirst({
    where: { id: resumeId, userId },
    include: {
      education: true,
      experience: true,
      project: true,
      personalInfo: true,
    },
  });
  return resume;
}
```

Also remove `user: true` from the `findAll` include block:
```typescript
// In findAll, change:
include: {
  education: true,
  experience: true,
  project: true,
  personalInfo: true,
  // Remove: user: true,
},
```

Also remove `user: true` from the `create` include block similarly.

**Step 4: Run test to verify it passes**

```bash
cd apps/web && bun test src/elysia-api/modules/resume/__tests__/service.test.ts
```

Expected: PASS (findById tests)

**Step 5: Commit**

```bash
git add apps/web/src/elysia-api/modules/resume/__tests__/service.test.ts \
        apps/web/src/elysia-api/modules/resume/service.ts
git commit -m "feat(resume): add ResumeService.findById"
```

---

## Task 4: Service — rewrite `updateResume` into unified `update` method

**Files:**
- Modify: `apps/web/src/elysia-api/modules/resume/__tests__/service.test.ts` (add tests)
- Modify: `apps/web/src/elysia-api/modules/resume/service.ts`

**Context:** Replace the broken `updateResume` + incomplete `updateResumeRelations` with a single `update` method that:
1. Checks ownership (`findFirst` with `{ id, userId }`)
2. Wraps everything in `$transaction`
3. Updates scalar fields if any provided
4. Upserts `personalInfo` if provided
5. For each relation array (experience/education/project) if provided: fetch current IDs from DB, delete IDs missing from input, update items with ID, create items without ID
6. Returns final resume state with `findUniqueOrThrow`

**Step 1: Add failing tests**

Append to `apps/web/src/elysia-api/modules/resume/__tests__/service.test.ts`:

```typescript
describe("ResumeService.update", () => {
  it("returns null when resume not found or not owned", async () => {
    const db = makeMockDb();
    (db.resume.findFirst as ReturnType<typeof mock>).mockResolvedValue(null);

    const result = await ResumeService.update(db, USER_ID, RESUME_ID, { title: "New Title" });

    expect(result).toBeNull();
  });

  it("returns updated resume when ownership check passes", async () => {
    const db = makeMockDb();
    (db.resume.findFirst as ReturnType<typeof mock>).mockResolvedValue({ id: RESUME_ID });

    const updatedResume = { ...RESUME_WITH_RELATIONS, title: "New Title" };
    // $transaction runs the callback — mock the tx internals
    (db.$transaction as ReturnType<typeof mock>).mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          resume: {
            update: mock().mockResolvedValue(undefined),
            findUniqueOrThrow: mock().mockResolvedValue(updatedResume),
          },
          personalInformation: { upsert: mock() },
          experience: { findMany: mock().mockResolvedValue([]), update: mock(), create: mock(), deleteMany: mock() },
          education: { findMany: mock().mockResolvedValue([]), update: mock(), create: mock(), deleteMany: mock() },
          project: { findMany: mock().mockResolvedValue([]), update: mock(), create: mock(), deleteMany: mock() },
        };
        return fn(tx);
      }
    );

    const result = await ResumeService.update(db, USER_ID, RESUME_ID, { title: "New Title" });

    expect(result).toEqual(updatedResume);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd apps/web && bun test src/elysia-api/modules/resume/__tests__/service.test.ts
```

Expected: FAIL — `ResumeService.update is not a function`

**Step 3: Replace `updateResume` and `updateResumeRelations` with unified `update` method**

In `apps/web/src/elysia-api/modules/resume/service.ts`:

First, update the imports at the top to include the new types:
```typescript
import type {
  EducationUpdateItem,
  ExperienceUpdateItem,
  FullResumeInputCreate,
  ProjectUpdateItem,
  ResumeUpdateBody,
  ResumeWithRelations,
} from "@rezumerai/types";
```

Then remove the entire `updateResume` method and the entire `updateResumeRelations` method, and replace with:

```typescript
/**
 * Updates a resume's scalar fields and/or nested relation arrays in a single transaction.
 * For relation arrays: items with an id are updated; items without an id are created;
 * existing items not present in the input are deleted.
 *
 * @param db - Prisma client instance
 * @param userId - Authenticated user ID (ownership check)
 * @param resumeId - Resume to update
 * @param data - Partial scalar fields + optional relation arrays
 * @returns Updated resume with all relations, or null if not found / not owned
 */
static async update(
  db: PrismaClient,
  userId: string,
  resumeId: string,
  data: ResumeUpdateBody,
): Promise<ResumeWithRelations | null> {
  const existing = await db.resume.findFirst({
    where: { id: resumeId, userId },
    select: { id: true },
  });
  if (!existing) return null;

  const { personalInfo, experience, education, project, ...scalarFields } = data;

  return db.$transaction(async (tx) => {
    // Update scalar resume fields if any were provided
    if (Object.keys(scalarFields).length > 0) {
      await tx.resume.update({
        where: { id: resumeId },
        data: scalarFields,
      });
    }

    // Upsert personal info
    if (personalInfo !== undefined) {
      await tx.personalInformation.upsert({
        where: { resumeId },
        update: personalInfo,
        create: { ...personalInfo, resumeId },
      });
    }

    // Diff-sync experience
    if (experience !== undefined) {
      await ResumeService._syncRelation(
        tx.experience,
        resumeId,
        experience,
      );
    }

    // Diff-sync education
    if (education !== undefined) {
      await ResumeService._syncRelation(
        tx.education,
        resumeId,
        education,
      );
    }

    // Diff-sync projects
    if (project !== undefined) {
      await ResumeService._syncRelation(
        tx.project,
        resumeId,
        project,
      );
    }

    return tx.resume.findUniqueOrThrow({
      where: { id: resumeId },
      include: {
        education: true,
        experience: true,
        project: true,
        personalInfo: true,
      },
    });
  });
}

/**
 * Syncs a relation array against the database:
 * - Deletes records not present in `items`
 * - Updates records that have an `id`
 * - Creates records that have no `id`
 */
private static async _syncRelation(
  relation: {
    findMany: (args: { where: { resumeId: string }; select: { id: true } }) => Promise<{ id: string }[]>;
    deleteMany: (args: { where: { id: { in: string[] } } }) => Promise<unknown>;
    update: (args: { where: { id: string }; data: unknown }) => Promise<unknown>;
    create: (args: { data: unknown }) => Promise<unknown>;
  },
  resumeId: string,
  items: Array<ExperienceUpdateItem | EducationUpdateItem | ProjectUpdateItem>,
): Promise<void> {
  const existing = await relation.findMany({ where: { resumeId }, select: { id: true } });
  const existingIds = existing.map((r) => r.id);
  const incomingIds = items.filter((i) => i.id).map((i) => i.id as string);
  const toDelete = existingIds.filter((id) => !incomingIds.includes(id));

  if (toDelete.length > 0) {
    await relation.deleteMany({ where: { id: { in: toDelete } } });
  }

  for (const item of items) {
    const { id, ...rest } = item;
    if (id) {
      await relation.update({ where: { id }, data: rest });
    } else {
      await relation.create({ data: { ...rest, resumeId } });
    }
  }
}
```

Note: `_syncRelation` is a private static helper. Biome disallows `private` on static-only class methods in some rules, but since the class already has `// biome-ignore lint/complexity/noStaticOnlyClass`, this is fine. Add a biome-ignore for the private method if biome flags it.

**Step 4: Run tests to verify they pass**

```bash
cd apps/web && bun test src/elysia-api/modules/resume/__tests__/service.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/elysia-api/modules/resume/__tests__/service.test.ts \
        apps/web/src/elysia-api/modules/resume/service.ts
git commit -m "feat(resume): replace updateResume+updateResumeRelations with unified update"
```

---

## Task 5: Service — add `deleteResume`

**Files:**
- Modify: `apps/web/src/elysia-api/modules/resume/__tests__/service.test.ts` (add tests)
- Modify: `apps/web/src/elysia-api/modules/resume/service.ts`

**Context:** Uses `deleteMany` with both `id` and `userId` so the ownership check is atomic. Prisma cascades to related tables (defined in schema). Returns `true` if deleted, `false` if not found/not owned.

**Step 1: Add failing tests**

Append to the service test file:

```typescript
describe("ResumeService.deleteResume", () => {
  it("returns true when resume is found and deleted", async () => {
    const db = makeMockDb();
    (db.resume.deleteMany as ReturnType<typeof mock>).mockResolvedValue({ count: 1 });

    const result = await ResumeService.deleteResume(db, USER_ID, RESUME_ID);

    expect(result).toBe(true);
    expect(db.resume.deleteMany).toHaveBeenCalledWith({
      where: { id: RESUME_ID, userId: USER_ID },
    });
  });

  it("returns false when resume is not found or not owned", async () => {
    const db = makeMockDb();
    (db.resume.deleteMany as ReturnType<typeof mock>).mockResolvedValue({ count: 0 });

    const result = await ResumeService.deleteResume(db, USER_ID, RESUME_ID);

    expect(result).toBe(false);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd apps/web && bun test src/elysia-api/modules/resume/__tests__/service.test.ts
```

Expected: FAIL — `ResumeService.deleteResume is not a function`

**Step 3: Add `deleteResume` to service**

Append after the `update` method (before the closing brace of the class):

```typescript
/**
 * Deletes a resume owned by the specified user.
 * Prisma cascades the delete to all related tables.
 *
 * @param db - Prisma client instance
 * @param userId - Authenticated user ID (ownership check)
 * @param resumeId - Resume to delete
 * @returns true if deleted, false if not found or not owned
 */
static async deleteResume(
  db: PrismaClient,
  userId: string,
  resumeId: string,
): Promise<boolean> {
  const result = await db.resume.deleteMany({
    where: { id: resumeId, userId },
  });
  return result.count > 0;
}
```

**Step 4: Run all service tests**

```bash
cd apps/web && bun test src/elysia-api/modules/resume/__tests__/service.test.ts
```

Expected: All tests PASS

**Step 5: Commit**

```bash
git add apps/web/src/elysia-api/modules/resume/__tests__/service.test.ts \
        apps/web/src/elysia-api/modules/resume/service.ts
git commit -m "feat(resume): add ResumeService.deleteResume"
```

---

## Task 6: Routes — add GET /:id, PATCH /:id, DELETE /:id

**Files:**
- Modify: `apps/web/src/elysia-api/modules/resume/index.ts`

**Context:** Follow the user module pattern. Use `resumeNotFound()` helper (returns `status(404, ...)`). Import `status` from `"elysia"`. The `body: "resume.update"` references the model registered in Task 2.

**Step 1: Replace `apps/web/src/elysia-api/modules/resume/index.ts`**

```typescript
import Elysia, { status } from "elysia";
import { authPlugin } from "../../plugins/auth";
import { prismaPlugin } from "../../plugins/prisma";
import { ResumeModels } from "./model";
import { ResumeService } from "./service";

// biome-ignore lint/nursery/useExplicitType: Eden inference
const resumeNotFound = () =>
  status(404, { success: false as const, error: "Resume not found" });

/**
 * Resume module — CRUD routes for resumes.
 * Protected by authPlugin — requires a valid Better Auth session.
 */
export const resumeModule = new Elysia({ prefix: "/resumes" })
  .use(prismaPlugin)
  .use(authPlugin)
  .model(ResumeModels)
  // ── GET /resumes ───────────────────────────────────────────────────────────
  .get("/", async ({ db, user }) => {
    const resumes = await ResumeService.findAll(db, user.id);
    return { success: true as const, data: resumes };
  })
  // ── POST /resumes ──────────────────────────────────────────────────────────
  .post(
    "/",
    async ({ db, user, body }) => {
      const newResume = await ResumeService.create(db, user.id, body);
      return { success: true as const, data: newResume };
    },
    { body: "resume.create" },
  )
  // ── GET /resumes/:id ───────────────────────────────────────────────────────
  .get(
    "/:id",
    async ({ db, user, params }) => {
      const resume = await ResumeService.findById(db, user.id, params.id);
      if (!resume) return resumeNotFound();
      return { success: true as const, data: resume };
    },
    { params: "resume.byIdParams" },
  )
  // ── PATCH /resumes/:id ─────────────────────────────────────────────────────
  .patch(
    "/:id",
    async ({ db, user, params, body }) => {
      const updated = await ResumeService.update(db, user.id, params.id, body);
      if (!updated) return resumeNotFound();
      return { success: true as const, data: updated };
    },
    {
      params: "resume.byIdParams",
      body: "resume.update",
    },
  )
  // ── DELETE /resumes/:id ────────────────────────────────────────────────────
  .delete(
    "/:id",
    async ({ db, user, params }) => {
      const deleted = await ResumeService.deleteResume(db, user.id, params.id);
      if (!deleted) return resumeNotFound();
      return { success: true as const, data: { id: params.id } };
    },
    { params: "resume.byIdParams" },
  );
```

**Step 2: Run biome check**

```bash
cd apps/web && bun run biome check src/elysia-api/modules/resume/
```

Expected: no errors

**Step 3: Run all tests to confirm no regressions**

```bash
bun test
```

Expected: all tests pass

**Step 4: Commit**

```bash
git add apps/web/src/elysia-api/modules/resume/index.ts
git commit -m "feat(resume): add GET/:id, PATCH/:id, DELETE/:id routes"
```

---

## Task 7: Store — add `addResume`, async `deleteResume`, force-refetch

**Files:**
- Create: `apps/web/src/store/__tests__/useResumeStore.test.ts`
- Modify: `apps/web/src/store/useResumeStore.ts`

**Context:**
- `addResume` appends a resume (used after create)
- `deleteResume` now calls `api.resumes({ id }).delete()` first, then removes from store on success
- `fetchResumes` gains a `force?: boolean` param; when `true` it resets `hasFetched` and re-fetches

**Step 1: Create test file with failing tests**

```typescript
// apps/web/src/store/__tests__/useResumeStore.test.ts
import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook, waitFor } from "@testing-library/react";

const mockResumesGet = mock();
const mockResumesPost = mock();
const mockResumesByIdDelete = mock();
const mockResumeById = mock().mockReturnValue({
  delete: mockResumesByIdDelete,
});

mock.module("@/lib/api", () => ({
  api: {
    resumes: Object.assign(mockResumeById, {
      get: mockResumesGet,
      post: mockResumesPost,
    }),
  },
}));

// Import AFTER mock is set up
const { useResumeStore } = await import("../useResumeStore");

const MOCK_RESUME = {
  id: "res_1",
  userId: "user_1",
  title: "My Resume",
  public: false,
  professionalSummary: "",
  template: "classic" as const,
  accentColor: "#000000",
  fontSize: "medium" as const,
  customFontSize: 1,
  skills: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  personalInfo: null,
  experience: [],
  education: [],
  project: [],
};

beforeEach(() => {
  // Reset store state between tests
  useResumeStore.setState({ resumes: [], isLoading: false, hasFetched: false });
  mockResumesGet.mockReset();
  mockResumesPost.mockReset();
  mockResumesByIdDelete.mockReset();
});

describe("useResumeStore.addResume", () => {
  it("appends a resume to the list", () => {
    const { result } = renderHook(() => useResumeStore());

    act(() => {
      result.current.addResume(MOCK_RESUME);
    });

    expect(result.current.resumes).toHaveLength(1);
    expect(result.current.resumes[0]?.id).toBe("res_1");
  });
});

describe("useResumeStore.deleteResume", () => {
  it("removes resume from store when API call succeeds", async () => {
    useResumeStore.setState({ resumes: [MOCK_RESUME], hasFetched: true });
    mockResumesByIdDelete.mockResolvedValue({ data: { success: true }, error: null });

    const { result } = renderHook(() => useResumeStore());

    await act(async () => {
      await result.current.deleteResume("res_1");
    });

    expect(result.current.resumes).toHaveLength(0);
    expect(mockResumeById).toHaveBeenCalledWith({ id: "res_1" });
  });

  it("does not remove resume from store when API call fails", async () => {
    useResumeStore.setState({ resumes: [MOCK_RESUME], hasFetched: true });
    mockResumesByIdDelete.mockResolvedValue({
      data: null,
      error: { error: "Not found" },
    });

    const { result } = renderHook(() => useResumeStore());

    await act(async () => {
      await result.current.deleteResume("res_1");
    });

    expect(result.current.resumes).toHaveLength(1);
  });
});

describe("useResumeStore.fetchResumes", () => {
  it("does not re-fetch when hasFetched is true and force is false", async () => {
    useResumeStore.setState({ resumes: [MOCK_RESUME], hasFetched: true });
    mockResumesGet.mockResolvedValue({ data: { data: [] }, error: null });

    const { result } = renderHook(() => useResumeStore());

    await act(async () => {
      await result.current.fetchResumes();
    });

    expect(mockResumesGet).not.toHaveBeenCalled();
  });

  it("re-fetches when force is true", async () => {
    useResumeStore.setState({ resumes: [MOCK_RESUME], hasFetched: true });
    mockResumesGet.mockResolvedValue({ data: { data: [MOCK_RESUME] }, error: null });

    const { result } = renderHook(() => useResumeStore());

    await act(async () => {
      await result.current.fetchResumes(true);
    });

    expect(mockResumesGet).toHaveBeenCalledTimes(1);
  });
});
```

**Step 2: Run tests to verify they fail**

```bash
cd apps/web && bun test src/store/__tests__/useResumeStore.test.ts
```

Expected: FAIL — `addResume is not a function` and related failures

**Step 3: Update `useResumeStore.ts`**

Replace the file content:

```typescript
import type { ResumeResponse } from "@rezumerai/types";
import { create } from "zustand";
import { api } from "@/lib/api";

interface ResumeStore {
  resumes: ResumeResponse[];
  isLoading: boolean;
  hasFetched: boolean;
  fetchResumes: (force?: boolean) => Promise<void>;
  addResume: (resume: ResumeResponse) => void;
  updateResume: (id: string, updates: Partial<ResumeResponse>) => void;
  deleteResume: (id: string) => Promise<void>;
}

export const useResumeStore = create<ResumeStore>((set, get) => ({
  resumes: [],
  isLoading: false,
  hasFetched: false,

  fetchResumes: async (force = false): Promise<void> => {
    if (get().hasFetched && !force) return;
    set({ isLoading: true });
    try {
      const { data } = await api.resumes.get();
      if (data && "data" in data && data.data) {
        set({ resumes: data.data as ResumeResponse[], hasFetched: true });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  addResume: (resume: ResumeResponse): void =>
    set((state) => ({ resumes: [...state.resumes, resume] })),

  updateResume: (id: string, updates: Partial<ResumeResponse>): void =>
    set((state) => ({
      resumes: state.resumes.map((resume) =>
        resume.id === id ? { ...resume, ...updates } : resume,
      ),
    })),

  deleteResume: async (id: string): Promise<void> => {
    const { data, error } = await api.resumes({ id }).delete();
    if (error || !data?.success) return;
    set((state) => ({
      resumes: state.resumes.filter((resume) => resume.id !== id),
    }));
  },
}));
```

**Step 4: Run tests to verify they pass**

```bash
cd apps/web && bun test src/store/__tests__/useResumeStore.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/store/__tests__/useResumeStore.test.ts \
        apps/web/src/store/useResumeStore.ts
git commit -m "feat(store): add addResume, async deleteResume, force fetchResumes"
```

---

## Task 8: Dashboard — wire up create, delete, edit title

**Files:**
- Modify: `apps/web/src/app/workspace/page.tsx`

**Context:**
- `handleCreateResume(title)` must call `api.resumes.post(...)` with a minimal valid payload, then `addResume` + navigate to the real ID
- `handleDeleteResume(id)` must call the store's async `deleteResume` (which hits the API)
- `handleEditTitle(newTitle)` must call `api.resumes({ id }).patch({ title: newTitle })`, then `updateResume`

Minimal POST payload for creating a resume (matches `FullResumeInputCreate` schema):
```typescript
{
  title,
  public: false,
  template: "classic",
  accentColor: "#000000",
  fontSize: "medium",
  skills: [],
  personalInfo: {
    fullName: "", email: "", phone: "", location: "",
    linkedin: "", website: "", profession: "", image: "",
  },
  experience: [],
  education: [],
  project: [],
}
```

**Step 1: Edit `apps/web/src/app/workspace/page.tsx`**

Add `addResume` to the store imports:
```typescript
const addResume = useResumeStore((state) => state.addResume);
```

Replace `handleCreateResume`:
```typescript
async function handleCreateResume(title: string): Promise<void> {
  if (!title.trim()) return;
  const { data, error } = await api.resumes.post({
    title,
    public: false,
    template: "classic",
    accentColor: "#000000",
    fontSize: "medium",
    skills: [],
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      website: "",
      profession: "",
      image: "",
    },
    experience: [],
    education: [],
    project: [],
  });
  if (error || !data?.success || !data.data) return;
  addResume(data.data as ResumeResponse);
  setModalState({ type: null });
  router.push(`${ROUTES.BUILDER}/${data.data.id}`);
}
```

Replace `handleDeleteResume`:
```typescript
const handleDeleteResume = useCallback(async (resumeId: string): Promise<void> => {
  const confirmed = window.confirm("Are you sure you want to delete this resume?");
  if (confirmed) {
    await deleteResume(resumeId);
  }
}, [deleteResume]);
```

Replace `handleEditTitle`:
```typescript
async function handleEditTitle(newTitle: string): Promise<void> {
  if (!newTitle.trim() || !modalState.resumeId) return;
  const { data, error } = await api.resumes({ id: modalState.resumeId }).patch({ title: newTitle });
  if (error || !data?.success) return;
  updateResume(modalState.resumeId, { title: newTitle });
  setModalState({ type: null });
}
```

Add `api` import at the top of the file:
```typescript
import { api } from "@/lib/api";
```

Add `ResumeResponse` to existing type imports if not already present:
```typescript
import type { ResumeResponse } from "@rezumerai/types";
```

**Step 2: Run biome check**

```bash
cd apps/web && bun run biome check src/app/workspace/page.tsx
```

Expected: no errors (fix any reported issues)

**Step 3: Commit**

```bash
git add apps/web/src/app/workspace/page.tsx
git commit -m "feat(dashboard): wire up create, delete, edit title to real API"
```

---

## Task 9: Builder — wire up save

**Files:**
- Modify: `apps/web/src/app/workspace/builder/[resumeId]/page.tsx`

**Context:** `handleSaveResume` currently simulates a save with `setTimeout`. Replace with a real `PATCH /resumes/:id` call using the full current `resumeData`. The function sends all scalar fields plus all relation arrays (full replace strategy from the user's perspective, diff strategy in the service).

**Step 1: Add `api` import if not present**

At the top of the builder page:
```typescript
import { api } from "@/lib/api";
```

**Step 2: Replace `handleSaveResume`**

```typescript
async function handleSaveResume(): Promise<void> {
  setIsSaving(true);
  try {
    const { data, error } = await api.resumes({ id: resumeId }).patch({
      title: resumeData.title,
      public: resumeData.public,
      professionalSummary: resumeData.professionalSummary,
      template: resumeData.template,
      accentColor: resumeData.accentColor,
      fontSize: resumeData.fontSize,
      customFontSize: resumeData.customFontSize,
      skills: resumeData.skills,
      personalInfo: resumeData.personalInfo ?? undefined,
      experience: resumeData.experience,
      education: resumeData.education,
      project: resumeData.project,
    });
    if (!error && data?.success && data.data) {
      updateResume(resumeId, data.data as Partial<ResumeResponse>);
      setLastSaved(new Date());
    }
  } catch {
    // Save failed silently — user can retry
  } finally {
    setIsSaving(false);
  }
}
```

**Step 3: Run biome check**

```bash
cd apps/web && bun run biome check src/app/workspace/builder/
```

Expected: no errors

**Step 4: Commit**

```bash
git add apps/web/src/app/workspace/builder/[resumeId]/page.tsx
git commit -m "feat(builder): wire up save to real PATCH /resumes/:id"
```

---

## Task 10: Final verification

**Step 1: Run all tests**

```bash
cd /path/to/rezumerai && bun run test
```

Expected: all tests pass

**Step 2: Run biome on entire codebase**

```bash
bun run check
```

Expected: no errors (auto-fix applied if needed, then re-run)

**Step 3: Run TypeScript type check**

```bash
bun run check-types
```

Expected: no errors. If `apps/web/src/constants/dummy.ts` has type errors, the `// @ts-nocheck` comment at the top of that file suppresses them — leave it as-is.

**Step 4: Run production build**

```bash
bun run build
```

Expected: successful build with no TypeScript errors.

**Step 5: Final commit if any auto-fixes were applied**

```bash
git add -A
git commit -m "chore: apply biome auto-fixes"
```

---

## Checklist Summary

- [ ] Task 1: `projects` → `project` in ResumeSchema, update types
- [ ] Task 2: Add `resume.byIdParams` + `resume.update` models
- [ ] Task 3: `findById` service method (with tests)
- [ ] Task 4: Unified `update` service method (with tests)
- [ ] Task 5: `deleteResume` service method (with tests)
- [ ] Task 6: Routes GET/:id, PATCH/:id, DELETE/:id
- [ ] Task 7: Store — addResume, async deleteResume, force fetchResumes (with tests)
- [ ] Task 8: Dashboard — create, delete, edit title wired to API
- [ ] Task 9: Builder — save wired to API
- [ ] Task 10: biome + types + tests + build all pass
