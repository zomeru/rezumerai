# Content Management Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin `Content Management` page that lets admins edit all six public content areas with structured editors plus a raw JSON fallback, while continuing to persist through existing `systemConfiguration` records.

**Architecture:** The feature adds a new `/admin/content` route and dashboard entry, then layers a content-specific admin client on top of the existing `useSystemConfigurations` and `useUpdateSystemConfiguration` hooks. The client is split into a controller hook, topic metadata helpers, schema-family editors, and a raw JSON fallback so state management, field rendering, and persistence remain separately understandable and testable.

**Tech Stack:** Bun, TypeScript, Next.js App Router, React 19, TanStack Query, Zod, Better Auth, Prisma, React Testing Library, Sonner, Lucide

---

## File Structure

### Create

- `apps/web/src/app/admin/content/page.tsx`
  - Server entrypoint for `/admin/content`; preloads system configuration data into React Query and renders the client page.
- `apps/web/src/components/Admin/ContentManagementPageClient.tsx`
  - Top-level admin content page shell that wires the controller hook to the topic navigator, schema editors, metadata panel, and save/reset controls.
- `apps/web/src/components/Admin/content/topic-metadata.ts`
  - Single source of truth mapping topics to labels, config keys, schema family, and public routes.
- `apps/web/src/components/Admin/content/utils.ts`
  - Parsing, draft comparison, schema selection, and raw JSON formatting helpers used by the page and tests.
- `apps/web/src/components/Admin/content/hooks/useContentManagementController.ts`
  - Feature-local controller hook that owns selected topic, per-topic draft state, dirty detection, raw/structured mode, and save/reset flows.
- `apps/web/src/components/Admin/content/TopicNavigator.tsx`
  - Left-hand topic list with dirty indicators and topic descriptions.
- `apps/web/src/components/Admin/content/ContentMetadataPanel.tsx`
  - Right-hand summary panel for config key, schema family, timestamps, public link, and mode-aware actions.
- `apps/web/src/components/Admin/content/RawJsonEditorPanel.tsx`
  - Raw JSON fallback editor with parse errors, format action, and schema-validation messaging.
- `apps/web/src/components/Admin/content/ArrayItemControls.tsx`
  - Shared move up / move down / remove controls for ordered arrays across the schema-family editors.
- `apps/web/src/components/Admin/content/ContentPageEditor.tsx`
  - Structured editor for `about`, `contact`, `privacy`, and `terms`.
- `apps/web/src/components/Admin/content/FaqContentEditor.tsx`
  - Structured editor for `faq`.
- `apps/web/src/components/Admin/content/LandingPageContentEditor.tsx`
  - Structured editor for `landing`.
- `apps/web/src/components/Admin/__tests__/ContentManagementPageClient.test.tsx`
  - Page-level workflow coverage using the existing admin hook mocks.
- `apps/web/src/components/Admin/content/__tests__/topic-metadata.test.ts`
  - Small unit coverage for topic-to-config-key/schema/public-route mapping and helper behavior.

### Modify

- `apps/web/src/constants/routing.ts`
  - Add `ROUTES.ADMIN_CONTENT`.
- `apps/web/src/components/Admin/index.tsx`
  - Add the `Content Management` dashboard card.
- `apps/web/src/test-utils/admin-hooks-module-mock.ts`
  - Reuse existing system-config mocks and extend only if page-level tests need extra router or toast helpers.

### Likely No Change

- `apps/web/src/proxy.ts`
  - `/admin/*` is already protected by the existing admin route gate.
- `apps/web/src/lib/system-content.ts`
  - Public read path and cache semantics remain unchanged.
- `packages/types/src/content/schema.ts`
  - Existing Zod schemas remain the canonical validation layer.

## Implementation Constraints

- Keep storage on `systemConfiguration`; do not introduce a new content table or Elysia endpoint.
- Default admins into structured editing; raw JSON is a fallback tab, not the primary UX.
- Preserve unsaved per-topic drafts while switching topics during the current page session.
- Use ordered editing controls for arrays; move buttons are acceptable and lower-risk than drag-and-drop for v1.
- Keep each new file focused on one responsibility so the page does not turn into a monolith.

## Chunk 1: Route Surface And Topic Metadata

### Task 1: Add the topic metadata boundary and route wiring

**Files:**
- Create: `apps/web/src/components/Admin/content/topic-metadata.ts`
- Create: `apps/web/src/components/Admin/content/__tests__/topic-metadata.test.ts`
- Modify: `apps/web/src/constants/routing.ts`
- Modify: `apps/web/src/components/Admin/index.tsx`
- Create: `apps/web/src/app/admin/content/page.tsx`

- [ ] **Step 1: Write the failing metadata test**

Create `apps/web/src/components/Admin/content/__tests__/topic-metadata.test.ts` with assertions that:
- exactly six topics are exported
- `landing` maps to `LANDING_PAGE_INFORMATION` and `/`
- `faq` maps to `FAQ_INFORMATION` and `/faq`
- `about`, `contact`, `privacy`, and `terms` map to `ContentPage` schema family and the correct public routes

Run:

```bash
bun test apps/web/src/components/Admin/content/__tests__/topic-metadata.test.ts
```

Expected:
- fail with `Cannot find module` for `topic-metadata` or missing exports

- [ ] **Step 2: Implement the topic metadata module**

Create `apps/web/src/components/Admin/content/topic-metadata.ts` exporting:
- a typed topic union based on the six supported topics
- a constant metadata array or record with label, description, config key, schema family, and public route
- helper accessors the page can import instead of duplicating mapping logic

Keep the file data-only plus tiny helpers; do not mix UI rendering into it.

- [ ] **Step 3: Add the admin route constant and dashboard entry**

Update `apps/web/src/constants/routing.ts` to add `ROUTES.ADMIN_CONTENT`.

Update `apps/web/src/components/Admin/index.tsx` to add a `Content Management` card that:
- links to `ROUTES.ADMIN_CONTENT`
- describes the page as the place to manage public-site content
- sits near `System Configuration`, not as a replacement for it

- [ ] **Step 4: Add the server route entrypoint**

Create `apps/web/src/app/admin/content/page.tsx` following the server-prefetch pattern already used by:
- `apps/web/src/app/admin/users/page.tsx`
- `apps/web/src/app/admin/system-config/page.tsx`

Implementation should:
- instantiate the shared QueryClient
- load `AdminService.listSystemConfigurations(prisma)`
- seed `queryKeys.admin.systemConfig()`
- render `ContentManagementPageClient` inside `HydrationBoundary`

- [ ] **Step 5: Re-run the metadata test and a targeted typecheck**

Run:

```bash
bun test apps/web/src/components/Admin/content/__tests__/topic-metadata.test.ts
bun run check:types
```

Expected:
- metadata test passes
- typecheck passes without route-constant or import errors

- [ ] **Step 6: Commit the chunk**

Run:

```bash
git add apps/web/src/components/Admin/content/topic-metadata.ts \
  apps/web/src/components/Admin/content/__tests__/topic-metadata.test.ts \
  apps/web/src/constants/routing.ts \
  apps/web/src/components/Admin/index.tsx \
  apps/web/src/app/admin/content/page.tsx
git commit -m "feat: add admin content route foundation"
```

## Chunk 2: Page Controller, Navigator, And Metadata Shell

### Task 2: Build the page state model and navigation shell

**Files:**
- Create: `apps/web/src/components/Admin/ContentManagementPageClient.tsx`
- Create: `apps/web/src/components/Admin/content/utils.ts`
- Create: `apps/web/src/components/Admin/content/hooks/useContentManagementController.ts`
- Create: `apps/web/src/components/Admin/content/TopicNavigator.tsx`
- Create: `apps/web/src/components/Admin/content/ContentMetadataPanel.tsx`
- Modify: `apps/web/src/test-utils/admin-hooks-module-mock.ts`
- Create: `apps/web/src/components/Admin/__tests__/ContentManagementPageClient.test.tsx`

- [ ] **Step 1: Write the failing page-shell tests**

Create `apps/web/src/components/Admin/__tests__/ContentManagementPageClient.test.tsx` with initial coverage for:
- rendering all six topics from mocked system-config data
- selecting a different topic
- keeping unsaved draft state when switching away and back
- showing a dirty indicator on a modified topic

Reuse the existing `@/hooks/useAdmin` mock strategy from `SystemConfigurationPageClient.test.tsx`.

Run:

```bash
bun test apps/web/src/components/Admin/__tests__/ContentManagementPageClient.test.tsx
```

Expected:
- fail because `ContentManagementPageClient` and the controller/helpers do not exist yet

- [ ] **Step 2: Implement shared content utilities**

Create `apps/web/src/components/Admin/content/utils.ts` with focused helpers for:
- extracting just the six content config entries from `SystemConfigurationListResponse`
- choosing the correct schema family for a topic
- comparing persisted vs draft values
- formatting a topic draft as pretty JSON

Keep helpers pure so they are easy to test and reuse.

- [ ] **Step 3: Implement the controller hook**

Create `apps/web/src/components/Admin/content/hooks/useContentManagementController.ts` to own:
- selected topic
- `Structured` vs `Raw JSON` mode
- per-topic persisted values
- per-topic draft values
- dirty-state calculation
- save/reset callbacks using `useSystemConfigurations` and `useUpdateSystemConfiguration`

The hook should:
- preserve drafts when switching topics
- avoid serializing to JSON on every structured field change
- expose a narrow API to the page component

- [ ] **Step 4: Implement the navigator, metadata panel, and page shell**

Create:
- `TopicNavigator.tsx`
- `ContentMetadataPanel.tsx`
- `ContentManagementPageClient.tsx`

The page should render:
- `AdminPageShell`
- left topic navigation
- center editor placeholder region keyed by schema family
- right metadata/actions panel

At this stage, the center panel can render lightweight schema-family placeholders, but each placeholder must include one bound editable field per topic family so the tests can prove draft updates, dirty indicators, and topic-switch preservation before the full editors exist.

- [ ] **Step 5: Re-run the page-shell test and fix any state leaks**

Run:

```bash
bun test apps/web/src/components/Admin/__tests__/ContentManagementPageClient.test.tsx
```

Expected:
- pass for navigation, topic switching, and draft preservation behavior

- [ ] **Step 6: Commit the chunk**

Run:

```bash
git add apps/web/src/components/Admin/ContentManagementPageClient.tsx \
  apps/web/src/components/Admin/content/utils.ts \
  apps/web/src/components/Admin/content/hooks/useContentManagementController.ts \
  apps/web/src/components/Admin/content/TopicNavigator.tsx \
  apps/web/src/components/Admin/content/ContentMetadataPanel.tsx \
  apps/web/src/components/Admin/__tests__/ContentManagementPageClient.test.tsx \
  apps/web/src/test-utils/admin-hooks-module-mock.ts
git commit -m "feat: add admin content page shell"
```

## Chunk 3: Structured Editors And Ordered Field Editing

### Task 3: Implement schema-family editors with ordered array controls

**Files:**
- Create: `apps/web/src/components/Admin/content/ArrayItemControls.tsx`
- Create: `apps/web/src/components/Admin/content/ContentPageEditor.tsx`
- Create: `apps/web/src/components/Admin/content/FaqContentEditor.tsx`
- Create: `apps/web/src/components/Admin/content/LandingPageContentEditor.tsx`
- Modify: `apps/web/src/components/Admin/ContentManagementPageClient.tsx`
- Modify: `apps/web/src/components/Admin/__tests__/ContentManagementPageClient.test.tsx`

- [ ] **Step 1: Extend the failing page test for structured editing**

Add tests to `apps/web/src/components/Admin/__tests__/ContentManagementPageClient.test.tsx` covering:
- editing a `ContentPage` field and saving successfully
- editing an FAQ category or item and saving successfully
- editing a landing-page hero field and saving successfully
- using move controls to reorder at least one ordered list without breaking save behavior

Mock `updateSystemConfigurationMutateAsyncMock` and assert the correct config key/value pair is sent.

Run:

```bash
bun test apps/web/src/components/Admin/__tests__/ContentManagementPageClient.test.tsx
```

Expected:
- fail because the schema-family editors and save wiring are not complete

- [ ] **Step 2: Implement shared ordered-array controls**

Create `apps/web/src/components/Admin/content/ArrayItemControls.tsx` with explicit:
- move up
- move down
- remove

Use button-based controls for v1. Keep the component generic so all editors share the same ordered-list behavior.

- [ ] **Step 3: Implement `ContentPageEditor`**

Create `apps/web/src/components/Admin/content/ContentPageEditor.tsx` supporting:
- title
- summary
- lastUpdated
- sections
- section paragraphs
- section bullets
- cards
- card items
- optional CTA

Keep field updates immutable and localized so the controller stays free of schema-specific mutation code.

- [ ] **Step 4: Implement `FaqContentEditor`**

Create `apps/web/src/components/Admin/content/FaqContentEditor.tsx` supporting:
- title
- summary
- categories
- FAQ items
- tags

Use the shared ordered-array controls for categories and items.

- [ ] **Step 5: Implement `LandingPageContentEditor` and wire the page to the real editors**

Create `apps/web/src/components/Admin/content/LandingPageContentEditor.tsx` supporting:
- bannerTag
- hero fields
- feature section and items
- workflow section and items
- CTA section
- footer description

Update `ContentManagementPageClient.tsx` to render the correct structured editor by schema family instead of the temporary placeholders.

- [ ] **Step 6: Re-run the structured editing test**

Run:

```bash
bun test apps/web/src/components/Admin/__tests__/ContentManagementPageClient.test.tsx
```

Expected:
- pass for structured edits and save wiring across all three schema families

- [ ] **Step 7: Commit the chunk**

Run:

```bash
git add apps/web/src/components/Admin/content/ArrayItemControls.tsx \
  apps/web/src/components/Admin/content/ContentPageEditor.tsx \
  apps/web/src/components/Admin/content/FaqContentEditor.tsx \
  apps/web/src/components/Admin/content/LandingPageContentEditor.tsx \
  apps/web/src/components/Admin/ContentManagementPageClient.tsx \
  apps/web/src/components/Admin/__tests__/ContentManagementPageClient.test.tsx
git commit -m "feat: add structured admin content editors"
```

## Chunk 4: Raw JSON Fallback, Validation Errors, And Final Verification

### Task 4: Complete raw JSON mode and finish verification

**Files:**
- Create: `apps/web/src/components/Admin/content/RawJsonEditorPanel.tsx`
- Modify: `apps/web/src/components/Admin/content/hooks/useContentManagementController.ts`
- Modify: `apps/web/src/components/Admin/content/utils.ts`
- Modify: `apps/web/src/components/Admin/content/ContentMetadataPanel.tsx`
- Modify: `apps/web/src/components/Admin/ContentManagementPageClient.tsx`
- Modify: `apps/web/src/components/Admin/__tests__/ContentManagementPageClient.test.tsx`

- [ ] **Step 1: Extend the failing page test for raw JSON mode**

Add tests covering:
- switching from structured mode to raw mode
- invalid JSON syntax disabling save and showing the parse error
- valid JSON with schema-invalid content blocking save with a validation message
- formatting raw JSON
- resetting raw edits back to the persisted value

Run:

```bash
bun test apps/web/src/components/Admin/__tests__/ContentManagementPageClient.test.tsx
```

Expected:
- fail because raw JSON parsing/validation/formatting is not complete

- [ ] **Step 2: Implement the raw JSON panel**

Create `apps/web/src/components/Admin/content/RawJsonEditorPanel.tsx` to handle:
- textarea editing
- format action
- syntax error display
- schema-validation error display
- read-only preview of the parsed state if useful, but do not add a second structured viewer unless it is needed for clarity

- [ ] **Step 3: Finish controller validation and mode-aware save behavior**

Update the controller hook and helpers so:
- raw edits parse into a typed draft only when JSON is valid
- save is blocked on syntax or schema errors
- successful raw saves still call `useUpdateSystemConfiguration`
- save success updates the persisted snapshot and clears dirty state for that topic

- [ ] **Step 4: Re-run the targeted admin content tests**

Run:

```bash
bun test apps/web/src/components/Admin/content/__tests__/topic-metadata.test.ts \
  apps/web/src/components/Admin/__tests__/ContentManagementPageClient.test.tsx
```

Expected:
- both tests pass

- [ ] **Step 5: Run full repository verification**

Run:

```bash
bun run check
bun run check:types
bun run test
bun run build
```

Expected:
- all four commands pass

If any command fails due to unrelated pre-existing issues, stop and record the exact failure before making further changes.

- [ ] **Step 6: Commit the chunk**

Run:

```bash
git add apps/web/src/components/Admin/content/RawJsonEditorPanel.tsx \
  apps/web/src/components/Admin/content/hooks/useContentManagementController.ts \
  apps/web/src/components/Admin/content/utils.ts \
  apps/web/src/components/Admin/content/ContentMetadataPanel.tsx \
  apps/web/src/components/Admin/ContentManagementPageClient.tsx \
  apps/web/src/components/Admin/__tests__/ContentManagementPageClient.test.tsx
git commit -m "feat: finalize admin content management"
```

## Plan Review Notes

- Keep new files responsibility-focused; do not merge the controller hook, metadata, schema selection, and all editor implementations into a single large client file.
- Reuse the existing `useSystemConfigurations` and `useUpdateSystemConfiguration` hooks unless a tiny content-specific wrapper materially reduces duplication.
- Treat the current public-page renderers as integration consumers, not implementation targets, unless a real mismatch appears during testing.
