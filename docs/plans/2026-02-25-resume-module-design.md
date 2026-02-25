# Resume Module Design

**Date:** 2026-02-25
**Branch:** dev
**Scope:** Backend Resume API (complete) + Frontend wiring

---

## Problem

The resume API module is incomplete:
- Only `GET /resumes` and `POST /resumes` exist
- No `GET /resumes/:id`, `PATCH /resumes/:id`, or `DELETE /resumes/:id`
- `updateResume` service method has a broken `project: {}` line
- `updateResumeRelations` is incomplete (education and project loops missing)
- Frontend create/save/delete actions are all stubbed (no real API calls)
- `ResumeSchema` uses `projects` (plural) but Prisma and builder use `project` (singular)

---

## Approach

**Single unified PATCH endpoint** with transactional service method. One `PATCH /resumes/:id` accepts scalar resume fields and optional relation arrays. The service diffs each relation array against the DB (delete removed, update existing by id, create new without id) inside a Prisma `$transaction`. Frontend makes one API call per save.

---

## Backend Design

### Types (`packages/types/src/resume/schema.ts`)

- Rename `projects` → `project` in `ResumeSchema` to align with Prisma
- Add `ResumeUpdateInputSchema`: all scalar resume fields (partial, no id/timestamps) + optional relation arrays where each item has an optional `id` field
- Export `ResumeUpdateInput` type

### Service (`elysia-api/modules/resume/service.ts`)

New / modified methods:

| Method | Description |
|--------|-------------|
| `findById(db, userId, id)` | `findUnique` with all relations; throw 404 if not found or wrong userId |
| `updateResume` | Remove broken `project: {}` line; update scalar fields only |
| `updateResumeRelations` | Rewritten — runs `$transaction`; diffs experience/education/project arrays (delete removed, update existing, create new); upserts personalInfo |
| `deleteResume(db, userId, id)` | Delete with `userId` guard; Prisma cascade handles relations |

### Routes (`elysia-api/modules/resume/index.ts`)

| Method | Path | Handler | Status |
|--------|------|---------|--------|
| GET | `/resumes` | `findAll` | exists |
| POST | `/resumes` | `create` | exists |
| GET | `/resumes/:id` | `findById` | new |
| PATCH | `/resumes/:id` | update (scalar + relations tx) | new |
| DELETE | `/resumes/:id` | `deleteResume` | new |

All routes protected by `authPlugin`. All responses include `personalInfo`, `experience`, `education`, `project`.

### Model (`elysia-api/modules/resume/model.ts`)

- Register `resume.update` schema (`ResumeUpdateInputSchema`) via `.model()`

---

## Frontend Design

### Store (`useResumeStore.ts`)

| Change | Detail |
|--------|--------|
| Add `addResume(resume)` | Appends to array; used after successful create |
| `deleteResume` | Now async — calls `DELETE /api/resumes/:id` first, then removes from store |
| `fetchResumes` | Add `forceFetch` param to reset `hasFetched` and re-fetch |

### Dashboard (`workspace/page.tsx`)

| Handler | Change |
|---------|--------|
| `handleCreateResume(title)` | Calls `POST /api/resumes` with title + defaults, navigates to real resumeId |
| `handleDeleteResume(id)` | Calls store's async `deleteResume` (hits API) |
| `handleEditTitle(newTitle)` | Calls `PATCH /api/resumes/:id` with `{ title: newTitle }`, updates store |

### Builder (`workspace/builder/[resumeId]/page.tsx`)

| Handler | Change |
|---------|--------|
| `handleSaveResume` | Calls `PATCH /api/resumes/:id` with full resumeData (scalars + all relation arrays) |

### Type Fix

- Rename all references of `resumeData.projects` → `resumeData.project` in builder and form components

---

## Error Handling

- 404: resume not found or not owned by user
- 400: validation errors (Elysia/Zod handles via `errorPlugin`)
- 500: unexpected errors caught by `errorPlugin`

---

## Out of Scope

- Upload resume (file parsing)
- Public share endpoint
- AI features
