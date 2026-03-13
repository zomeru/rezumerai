# Content Management Design

Date: 2026-03-13
Status: Reviewed, ready for user approval

## Summary

Add a dedicated admin `Content Management` surface for editing all six public content areas:

- `landing`
- `about`
- `contact`
- `faq`
- `privacy`
- `terms`

The feature will provide typed editors for each content schema family, preserve a raw JSON fallback for power users, and continue persisting data through the existing `systemConfiguration` records. Public pages will keep reading content through the current `system-content` helpers, so the implementation improves admin UX without introducing a second storage model.

## Context

Public pages already read database-backed content from `systemConfiguration` through:

- `apps/web/src/lib/system-content.ts`
- `packages/types/src/content/schema.ts`

The current admin experience for these records is the generic JSON editor in:

- `apps/web/src/components/Admin/SystemConfigurationPageClient.tsx`

That works for engineering users but is a poor fit for operational content editing. The core gap is workflow and usability, not persistence.

## Goals

- Add a dedicated admin page for managing public content.
- Support all six existing public content topics in the first version.
- Provide structured editors tailored to the existing content schemas.
- Keep a raw JSON fallback available per topic.
- Reuse the existing admin query and mutation flow for `systemConfiguration`.
- Preserve current public-page loading, caching, and fallback behavior.
- Keep the first version additive and low risk.

## Non-Goals

- Introducing a new content persistence model
- Live public-page preview rendering inside admin
- Drafts, version history, or scheduled publishing
- Rich text editing
- Image upload or asset management
- Localization or multilingual content
- Reworking the public content schemas unless implementation reveals a blocker

## Existing System

### Storage

Public content is stored as JSON in `systemConfiguration` under these existing keys:

- `LANDING_PAGE_INFORMATION`
- `ABOUT_US_INFORMATION`
- `CONTACT_INFORMATION`
- `FAQ_INFORMATION`
- `PRIVACY_POLICY_INFORMATION`
- `TOS_INFORMATION`

### Validation

The existing content schemas are already defined in `packages/types/src/content/schema.ts`:

- `LandingPageInformationSchema`
- `FaqInformationSchema`
- `ContentPageSchema`

### Runtime Reads

Public pages and AI helpers already read these values through `apps/web/src/lib/system-content.ts`, with cache invalidation already wired to the admin system configuration update path.

## Proposed Architecture

### Route Surface

Add a new admin route:

- `ROUTES.ADMIN_CONTENT = "/admin/content"`

Update the admin dashboard card list in `apps/web/src/components/Admin/index.tsx` to surface a `Content Management` entry alongside the existing admin sections.

The existing `System Configuration` page remains available for internal settings and low-level maintenance. `Content Management` becomes the primary surface for public content editing.

### Route Implementation

Add:

- `apps/web/src/app/admin/content/page.tsx`

This page should follow the same pattern as other admin pages:

- fetch data on the server
- seed the React Query cache
- render a client page component inside `HydrationBoundary`

The page should reuse the existing `AdminService.listSystemConfigurations` server-side load and the existing admin query key infrastructure.

### Client Component Structure

Add a new top-level client page:

- `apps/web/src/components/Admin/ContentManagementPageClient.tsx`

This component should be built on the shared admin shell primitives in `apps/web/src/components/Admin/AdminUI.tsx`.

To keep the page maintainable, split the implementation into focused editor components:

- `ContentPageEditor`
  - handles `about`, `contact`, `privacy`, `terms`
- `FaqContentEditor`
  - handles `faq`
- `LandingPageContentEditor`
  - handles `landing`

If the page grows too large, add a local feature folder structure under `apps/web/src/components/Admin/content/` for editor components, field helpers, and topic metadata.

### Topic Metadata Boundary

Create a single source of truth for content-topic metadata. This mapping should include:

- topic id
- admin label
- description
- backing system configuration key
- schema family
- public route href

This prevents route labels, config keys, and schema selection from drifting across the UI.

## UX Design

### Page Layout

`/admin/content` should use a three-column layout on desktop:

- left: topic navigator
- center: structured editor
- right: metadata and fallback tools

On smaller screens, the layout can collapse into stacked panels while preserving the same functional sections.

### Topic Navigator

The navigator should list all six topics using admin-friendly names:

- Landing Page
- About
- Contact
- FAQ
- Privacy Policy
- Terms of Service

Each item should show:

- display label
- short description
- unsaved-changes indicator when the current in-memory draft differs from the persisted value

### Editor Modes

Each topic editor should expose two modes:

- `Structured`
- `Raw JSON`

`Structured` is the default. `Raw JSON` exists as a fallback, not the primary path.

### Structured Editors

#### ContentPageEditor

Edits the existing `ContentPageSchema` shape:

- `title`
- `summary`
- `lastUpdated`
- `sections`
- `cards`
- optional `cta`

It should support dynamic add/remove/reorder flows for:

- sections
- section paragraphs
- section bullets
- cards
- card items

Reordering can be implemented with explicit move controls or drag-and-drop. The requirement is ordered editing support, not a specific interaction library.

#### FaqContentEditor

Edits the existing `FaqInformationSchema` shape:

- `title`
- `summary`
- `categories`

It should support dynamic add/remove/reorder flows for:

- categories
- category items
- FAQ item tags

Reordering can be implemented with explicit move controls or drag-and-drop.

#### LandingPageContentEditor

Edits the existing `LandingPageInformationSchema` shape:

- `bannerTag`
- `hero`
- `featureSection`
- `workflowSection`
- `ctaSection`
- `footer`

It should support dynamic add/remove/reorder flows for:

- feature items
- workflow items

Reordering can be implemented with explicit move controls or drag-and-drop.

The editor should present nested groups with clear headings rather than exposing the landing JSON shape as a flat form.

### Metadata And Utility Panel

The right-side panel should show:

- persisted configuration key
- schema family
- created timestamp
- updated timestamp
- quick link to the corresponding public route

The same panel should also contain:

- mode switcher
- reset control
- save control
- raw JSON utilities when raw mode is active

## Editing Workflow

### Data Loading

The page should load all system configuration entries once through the existing admin query. The content page then derives the six public content topics from that response.

No new admin endpoint is required for the first version.

### Draft State

For each topic, the client should keep:

- `persistedValue`: the last server-confirmed value
- `draftValue`: the current editable value

Drafts should be stored as typed objects, not as JSON strings.

### Topic Switching

Switching between topics should preserve unsaved drafts in memory during the current session. The page should not immediately discard unsaved changes when the admin switches to another topic.

### Save Flow

Saving should occur one topic at a time.

Expected flow:

1. validate current draft against the topic schema
2. block save if validation fails
3. submit the existing system configuration mutation for the matching config key
4. update the cached admin system configuration data
5. show success feedback

### Reset Flow

`Reset changes` should restore the selected topic draft to the current persisted value from the query cache.

### Raw JSON Flow

In `Raw JSON` mode:

- show the selected topic draft as formatted JSON
- allow direct editing
- parse JSON locally
- block save on syntax errors
- still enforce schema validation before mutation

`Format JSON` should be available only in raw mode.

## Data Flow And Integration

### Persistence Model

This feature must not introduce a new content table or alternate content storage path.

All saves continue using the existing admin system configuration mutation in:

- `apps/web/src/hooks/useAdmin.ts`

The topic-to-key mapping translates:

- `landing` -> `LANDING_PAGE_INFORMATION`
- `about` -> `ABOUT_US_INFORMATION`
- `contact` -> `CONTACT_INFORMATION`
- `faq` -> `FAQ_INFORMATION`
- `privacy` -> `PRIVACY_POLICY_INFORMATION`
- `terms` -> `TOS_INFORMATION`

### Validation

Use the existing Zod schemas from `packages/types/src/content/schema.ts` as the final save gate.

Validation should happen in two layers:

- light client-side field guidance where practical
- final schema validation before mutation

The schema is the canonical source of truth.

### Cache Invalidation

After a successful save:

- update or invalidate the existing admin system-config query
- rely on the current admin service update path to continue clearing public content cache

The public-page read path in `apps/web/src/lib/system-content.ts` should remain unchanged.

## Error Handling

### Validation Errors

If structured edits produce invalid data:

- keep the current draft intact
- show a clear admin-facing error message
- do not send the mutation

If raw JSON is syntactically invalid:

- show the parse error
- disable save until the JSON is valid

If raw JSON parses successfully but fails schema validation:

- show the schema validation failure
- block save

### Mutation Failures

If the system configuration update fails:

- preserve the draft
- surface the failure with the same toast + inline error pattern already used by admin configuration editing
- avoid optimistic UI that could imply a successful write before the server confirms it

## Testing Strategy

### Client Coverage

Add tests for the new content management page covering:

- rendering the six topics
- selecting different topics
- preserving unsaved drafts while switching topics
- reset behavior
- structured save flows for each schema family
- raw JSON syntax failure handling
- raw JSON schema-validation failure handling
- successful save feedback and query refresh behavior

### Mapper Coverage

If helper functions are introduced for topic metadata or config-key mapping, add small unit tests for those helpers.

### Verification

Default verification for implementation should include:

- `bun run check`
- `bun run check:types`
- `bun run test`
- `bun run build`

## Rollout Plan

This feature is additive.

Rollout steps:

1. add the new admin content route and dashboard card
2. keep the existing `System Configuration` page intact
3. use `Content Management` as the preferred admin workflow for public content

If desired later, content-related entries on the `System Configuration` page can link back to `Content Management`, but that is not required for this first version.

## Risks And Mitigations

### Risk: Editor complexity

The landing and FAQ schemas are more nested than the generic content-page schema.

Mitigation:

- split editors by schema family
- isolate topic metadata and conversion helpers
- avoid a single monolithic page component

### Risk: Divergence from the schema

A hand-built form can drift from the canonical Zod schemas.

Mitigation:

- validate against the existing schemas on save
- keep schema-family editors directly aligned to the current schema shapes
- treat raw JSON mode as a fallback, not a separate model

### Risk: Admin confusion between content and config

Admins may not know when to use `Content Management` versus `System Configuration`.

Mitigation:

- present `Content Management` clearly as the page for public-site content
- leave `System Configuration` for low-level platform settings
- keep labels and descriptions explicit in both admin sections

## Implementation Notes

Expected touched areas:

- `apps/web/src/constants/routing.ts`
- `apps/web/src/components/Admin/index.tsx`
- `apps/web/src/app/admin/content/page.tsx`
- `apps/web/src/components/Admin/ContentManagementPageClient.tsx`
- feature-local content editor components
- `apps/web/src/hooks/useAdmin.ts` only if a thin content-specific wrapper improves reuse
- admin tests for the new page and helpers

No changes are expected to:

- `apps/web/src/lib/system-content.ts` public read behavior
- content schema structure in `packages/types/src/content/schema.ts`, unless implementation reveals a concrete issue

## Open Questions Resolved

- Scope: first version covers all six public content areas
- Storage model: keep the existing `systemConfiguration` persistence model
- Admin UX direction: use a hybrid content hub with structured editors and raw JSON fallback
