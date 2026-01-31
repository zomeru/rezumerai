# AI Instructions: Resume Builder Enhancement

## Prerequisites

Before starting any work, complete the following setup steps:

### 1. Activate Serena MCP Server

Call the Serena activation function to initialize the project context:

```
mcp_serena_activate_project
```

This must be done **every time** before starting work on this project.

### 2. Retrieve Documentation

Use the Context7 documentation retrieval function to gather relevant documentation:

```
mcp_context7_get-library-docs
```

Retrieve documentation for:

- **React** – Component patterns, hooks, and best practices
- **Next.js (App Router)** – Server/Client Components, routing, data fetching
- **Tailwind CSS v4** – Utility classes, theming, configuration

---

## Project Context

| Item | Location |
|------|----------|
| Project Type | Next.js web app inside Turborepo |
| Web App Root | `app/web` |
| Resume Builder Route | `app/app` |
| Landing Page | `app/page.tsx` |
| Styling Framework | Tailwind CSS v4 |

---

## Tasks

### Task 1: UI Theming

**Objective:** Update the Resume Builder UI to be visually identical to the landing page.

**Steps:**

1. **Analyze the landing page** (`app/page.tsx`):
   - Extract color palette, typography scales, and spacing patterns
   - Identify reusable components and design tokens
   - Note any custom Tailwind configurations

2. **Audit the Resume Builder** (`app/ap`):
   - List all components that need visual updates
   - Identify inconsistencies with the landing page design

3. **Apply consistent theming**:
   - Match colors using Tailwind CSS v4 color utilities
   - Align typography (font family, sizes, weights, line heights)
   - Standardize spacing and layout patterns
   - Ensure consistent border radii, shadows, and visual effects

4. **Follow modern 2026 design aesthetics**:
   - Clean, minimal layouts with generous whitespace
   - Clear visual hierarchy through typography and color contrast
   - Polished spacing and pixel-perfect alignment
   - Subtle animations and transitions (hover states, loading states)
   - Accessible, readable typography (minimum 16px body text)

5. **Implementation guidelines**:
   - Use Tailwind CSS v4 utilities exclusively
   - Avoid custom CSS unless absolutely necessary
   - Reuse existing components and design tokens
   - Maintain consistency with existing project conventions

---

### Task 2: Resume Builder Enhancements

**Objective:** Add feature-rich capabilities to the Resume Builder.

#### 2.1 Dynamic Font Size Control

**Steps:**

1. Create a font size selector component with options (e.g., Small, Medium, Large)
2. Implement state management for the selected font size
3. Apply font size changes dynamically to the resume preview
4. Persist user preference (consider localStorage or app state)
5. Ensure font size changes reflect in the exported PDF

#### 2.2 True PDF Export (Direct File Generation)

**Steps:**

1. Choose an appropriate PDF generation library:
   - Recommended: `@react-pdf/renderer`, `jsPDF`, `pdf-lib` or any compatible pdf library.
   - Avoid browser print dialog (`window.print()`)

2. Implement PDF generation:
   - Create a PDF template matching the on-screen resume design
   - Map resume data to the PDF structure
   - Handle fonts, colors, and layout consistently

3. Ensure design fidelity:
   - The exported PDF must closely match the on-screen design
   - Test with various resume content lengths
   - Verify proper pagination for multi-page resumes

4. Implement download functionality:
   - Generate PDF as a Blob
   - Trigger file download with appropriate filename (e.g., `Resume_[Name].pdf`)

---

### Task 3: Code Quality & Build Validation

**Objective:** Ensure code quality and successful builds.

**Steps:**

1. **Run code checks**:
   ```bash
   bun run code:check
   ```
   - Fix all linting errors
   - Resolve TypeScript issues
   - Address formatting inconsistencies

2. **Run build**:
   ```bash
   bun run build
   ```
   - Ensure build completes with zero errors
   - Address any warnings if critical

3. **Common issues to watch for**:
   - Missing type definitions
   - Unused imports or variables
   - React hook dependency warnings
   - Server/Client Component boundary issues

---

### Task 4: Best Practices

**Objective:** Apply modern React and Next.js best practices.

#### Server vs Client Components

- Use **Server Components** (default) for:
  - Static content rendering
  - Data fetching
  - Components without interactivity

- Use **Client Components** (`"use client"`) only for:
  - Event handlers (onClick, onChange, etc.)
  - Browser APIs (localStorage, window)
  - React hooks (useState, useEffect, etc.)
  - Third-party client-only libraries

#### Component Architecture

- Separate concerns into small, focused components
- Create reusable UI primitives
- Co-locate related files (component, styles, tests)
- Use composition over inheritance

#### Performance Optimization

- Avoid unnecessary re-renders:
  - Memoize expensive computations with `useMemo`
  - Stabilize callbacks with `useCallback`
  - Use `React.memo` for pure components when beneficial
- Implement code splitting for large components
- Optimize images with Next.js `<Image>` component

#### Code Organization

- Maintain consistent file naming conventions
- Group related functionality into modules
- Write self-documenting code with clear variable names
- Add comments only for complex logic

---

## Output Expectations

The AI must:

1. **Modify existing files** where appropriate (avoid unnecessary file creation)
2. **Explain significant decisions** – Document any architectural or design choices
3. **Ensure production readiness** – All changes should be deployable
4. **Follow project conventions** – Match existing code style and patterns
5. **Test changes** – Verify functionality and appearance before finalizing

---

## Checklist

Before considering the task complete, verify:

- [ ] Serena MCP server activated
- [ ] Relevant documentation retrieved
- [ ] Resume Builder UI matches landing page theme
- [ ] Modern 2026 design aesthetic applied
- [ ] Dynamic font size control implemented
- [ ] True PDF export (direct download) working
- [ ] PDF design matches on-screen preview
- [ ] `bun run code:check` passes with no errors
- [ ] `bun run build` completes successfully
- [ ] Server/Client Components used correctly
- [ ] Code follows React and Next.js best practices