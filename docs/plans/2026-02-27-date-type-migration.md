# Date Type Migration: String → DateTime

**Date:** 2026-02-27
**Status:** Approved

## Goal

Migrate `Experience.startDate`, `Experience.endDate`, and `Education.graduationDate` from `String` to
`DateTime` in Prisma, and propagate that change consistently across every layer of the monorepo
(Prisma schema, Zod schemas, utils, backend service, frontend forms, templates, seed data).

## Decision: z.coerce.date() at the API boundary

Zod schemas use `z.coerce.date()` — accepts ISO strings from API clients and `Date` objects from Prisma
directly. The frontend store holds `Date | null`. The `parseYearMonth`/`formatFullDate` roundtrip in
forms is eliminated.

`endDate` is nullable (`DateTime?`). `NULL` = currently employed. `isCurrent: true` remains the Boolean
flag; `endDate: null` is the structural representation.

Existing `endDate = 'Present'` rows → `NULL` via data migration SQL.

---

## Layer-by-Layer Changes

### 1. Prisma Schema (`packages/database/prisma/models/resume.prisma`)

- `Experience.startDate`: `String` → `DateTime`
- `Experience.endDate`: `String` → `DateTime?`
- `Experience.company`: add `@default("")`
- `Experience.position`: add `@default("")`
- `Education.graduationDate`: `String` → `DateTime`
- `Education.institution`: add `@default("")`
- `Education.degree`: add `@default("")`
- `Project.name`: add `@default("")`
- `Resume.title`: add `@default("")`

Migration SQL (embedded in Prisma migration):
```sql
-- Null out 'Present' / isCurrent endDates before type cast
UPDATE experience SET end_date = NULL WHERE end_date = 'Present' OR is_current = true;
-- Cast remaining YYYY-MM strings to first-of-month timestamptz
UPDATE experience SET start_date = (start_date || '-01')::timestamptz WHERE start_date IS NOT NULL;
UPDATE experience SET end_date   = (end_date   || '-01')::timestamptz WHERE end_date   IS NOT NULL;
UPDATE education  SET graduation_date = (graduation_date || '-01')::timestamptz WHERE graduation_date IS NOT NULL;
```

### 2. Zod Schemas (`packages/types/src/resume/schema.ts`)

```ts
// ExperienceItemSchema
startDate: z.coerce.date()
endDate:   z.coerce.date().nullable()

// EducationItemSchema
graduationDate: z.coerce.date()
```

All derived schemas (UpdateItem, InputCreate, UpdateBody) inherit changes automatically.

### 3. Utils (`packages/utils/src/date.ts`)

- `formatShortDate(date: Date | null | undefined): string` — extend signature to accept `null`; return `""` for null/undefined
- `formatFullDate(date: Date | null | undefined): string` — extend to accept `null`
- `parseYearMonth` — kept but no longer used in main flows

### 4. Backend Service (`apps/web/src/elysia-api/modules/resume/service.ts`)

No structural changes needed. Prisma receives `Date | null` objects directly from validated Zod input.

### 5. Frontend Forms

- `ExperienceFormEnhanced.tsx`:
  - `handleUpdate` date field type: `string | boolean` → `Date | null | boolean`
  - DatePicker `selected` prop: `exp.startDate` directly (already `Date`)
  - DatePicker `onSelect`: pass `date` directly, no `formatFullDate` wrapper
  - `isCurrent` checked → set `endDate: null` (not `""`)
  - Display: `formatShortDate(exp.startDate)` — works via updated util signature

- `EducationFormEnhanced.tsx`:
  - Same pattern: `edu.graduationDate` is `Date`, passes directly to DatePicker
  - `handleUpdate` date field type: `string` → `Date | null`

### 6. Templates (all 4)

`formatShortDate` signature update handles these transparently.
Null-guard for `exp.endDate`: `exp.isCurrent ? "Present" : formatShortDate(exp.endDate)`

### 7. Seed / Dummy Data (`packages/database/dummy-data/resumes.ts`)

- `"YYYY-MM"` strings → `new Date(year, month - 1, 1)`
- `endDate: "Present"` → omit field (nullable, defaults to null)

---

## Acceptance Criteria

- [ ] Prisma migration runs cleanly, existing data preserved
- [ ] No `String` date fields remain in Prisma schema
- [ ] Zod schemas use `z.coerce.date()` for all date fields
- [ ] Frontend forms work with `Date | null` directly — no string intermediaries
- [ ] Templates render dates correctly (null endDate shows "Present")
- [ ] Utils accept `Date | null | undefined`
- [ ] TypeScript strict mode: zero `any`, zero unsafe casts
- [ ] Seed data uses proper `Date` objects
- [ ] All existing tests pass; new tests cover null endDate
