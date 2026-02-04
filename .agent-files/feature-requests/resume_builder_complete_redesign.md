# AI Instructions: Resume Builder Complete Redesign & Enhancement

## Overview

This document provides step-by-step instructions for performing a complete UI redesign and feature enhancement of the Resume Builder feature in a Next.js web application.

---

## Prerequisites

Before starting any work, complete the following setup steps:

### Step 1: Activate Serena MCP Server

Call the Serena MCP server activation function to initialize the project context:

```
mcp_serena_activate_project
```

This must be done **every time** before starting work on this project.

### Step 2: Retrieve Documentation Context

Use the Context7 MCP function to retrieve relevant documentation:

```
mcp_context7_get-library-docs
```

Retrieve documentation for:

- **React** — Component patterns, hooks, and best practices
- **Next.js (App Router)** — Server Components, Client Components, routing, and data fetching
- **Tailwind CSS v4** — Utility classes, configuration, and new v4 features

This ensures all implementation decisions are informed by current best practices.

---

## Project Context

Understand the project structure before making changes:

| Item | Location |
|------|----------|
| Project Root | `apps/web` (inside Turborepo) |
| Resume Builder Feature | `src/app/app/builder` route (App Router) |
| Dashboard | `src/app/app` route (App Router) |
| Landing Page | `src/app/page.tsx` |
| Styling Framework | Tailwind CSS v4 |

### Key Points

- This is a **Turborepo** monorepo structure
- The web app is located at `apps/web`
- The Resume Builder lives under the `src/app/app/builder/page.tsx` route
- The Dashboard lives under `src/app/app/page.tsx`
- The landing page (`src/app/page.tsx`) defines the brand identity and design system to follow
- **Client-side only** — There is no server code in this project. All implementations must be client-side.

---

## Task 1: Complete UI Redesign

### 1.1 Analyze Current Implementation

1. **Review the existing Resume Builder**
   - Navigate to `src/app/app/builder/page.tsx`
   - Resume builder components live under `apps/web/src/components/ResumeBuilder`
   - Document all existing components, their structure, and functionality
   - Identify current layout patterns, spacing, and typography

2. **Review the existing Dashboard**
   - Navigate to `src/app/app/page.tsx`
   - Dashboard components live under `apps/web/src/components/Dashboard`
   - Document all existing components, their structure, and functionality
   - Identify current layout patterns, spacing, and typography

3. **Study the Landing Page Design System**
   - Open `src/app/page.tsx`
   - Some components used in it live under `src/apps/web/src/components`
   - Extract and document:
     - Color palette (primary, secondary, accent colors)
     - Typography scale (font families, sizes, weights)
     - Spacing patterns
     - Component styles (buttons, cards, inputs)
     - Animation patterns
   - These design tokens must be carried into the Resume Builder

### 1.2 Plan the Redesign

Create a redesign plan that addresses:

1. **Layout Structure**
   - Design a new layout hierarchy (not incremental changes, this means recreating a complete new markup structure)
   - Consider sidebar vs. top navigation patterns
   - Plan responsive breakpoints
   - Ensure clear visual separation between editor and preview sections

2. **Visual Hierarchy**
   - Define heading levels and their styles
   - Plan content grouping and sectioning
   - Establish focus areas and call-to-action placement

3. **Component Architecture**
   - List all components to be created or rebuilt
   - Define component boundaries and responsibilities
   - Plan for reusability and composition

### 1.3 Implement the Redesign

#### Design Quality Standards

The redesigned UI must meet these criteria:

- **Modern & Premium** — 2026-era SaaS quality comparable to Vercel, Linear, or Notion
- **Clean & Minimal** — Intentional layout with no visual clutter
- **Strong Visual Hierarchy** — Clear distinction between primary, secondary, and tertiary content
- **Refined Typography** — Proper type scale with appropriate line heights and letter spacing
- **Generous Whitespace** — Breathing room between elements
- **Professional & Production-Ready** — No placeholder or rough edges

#### Implementation Steps

1. **Rebuild the Layout Structure**
   ```
   - Create new layout components from scratch
   - Implement a clear grid system
   - Establish consistent spacing using Tailwind's spacing scale
   - Add responsive design for all breakpoints
   ```

2. **Redesign Form Controls & Inputs**
   ```
   - Modern input field designs with proper focus states
   - Custom select dropdowns if needed
   - Accessible form labels and error states
   - Consistent border radius and padding
   ```

3. **Implement Typography System**
   ```
   - Use the landing page's font family
   - Establish clear heading hierarchy (h1-h6)
   - Set appropriate line heights for readability
   - Apply consistent font weights
   ```

4. **Apply Color System**
   ```
   - Match landing page brand colors
   - Implement proper contrast ratios for accessibility
   - Use subtle background variations for depth
   - Apply accent colors purposefully
   ```

5. **Add Animations & Transitions**
   ```
   - Subtle hover states on interactive elements
   - Smooth transitions for state changes
   - Purposeful micro-interactions
   - Avoid excessive or distracting animations
   ```

#### Tailwind CSS v4 Requirements

- **Use utility-first approach** — Compose styles from Tailwind utilities
- **Avoid custom CSS** — Only use when Tailwind cannot achieve the design
- **Leverage Tailwind v4 features**:
  - CSS-first configuration
  - Native CSS cascade layers
  - Improved color palette
  - Container queries (if applicable)
- **Use composable patterns** — Create reusable utility combinations via components, not @apply

---

## Task 2: Resume Builder Enhancements

### 2.0 Install Required Libraries

Before implementing enhancements, install the necessary dependencies:

```bash
# Navigate to the web app directory
cd apps/web

# PDF Generation
bun add @react-pdf/renderer # Or other react-compatible pdf viewer

# Rich Text Editing
bun add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-link @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-highlight # Or another compatible libraries

# Drag and Drop for section reordering
bun add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities # Or another compatible libraries

# Date Picker for experience/education dates
bun add react-day-picker date-fns # Or another compatible libraries

# Icons (if not already installed)
bun add lucide-react

# Color Picker for theme customization
bun add react-colorful
```

### 2.1 Advanced Resume Editing Features

Implement comprehensive editing capabilities:

#### 2.1.1 Rich Text Editor

Implement rich text editing for resume sections:

```
- Use Tiptap as the rich text editor
- Enable formatting options:
  - Bold, Italic, Underline, Strikethrough
  - Bullet lists and numbered lists
  - Text alignment (left, center, right)
  - Links
  - Text color and highlighting
- Apply to description fields (work experience, projects, summary)
- Ensure clean HTML output for PDF generation
```

#### 2.1.2 Drag-and-Drop Section Reordering

Allow users to customize resume layout:

```
- Use @dnd-kit for drag-and-drop functionality
- Enable reordering of:
  - Main sections (Experience, Education, Skills, Projects, etc.)
  - Individual items within sections (job entries, education entries)
- Provide visual feedback during drag operations
- Persist section order in state
```

#### 2.1.3 Multiple Resume Templates

Provide template options:

```
- Create at least 3 distinct templates:
  - Classic/Traditional (single column, conservative)
  - Modern (two-column, contemporary design)
  - Minimal (clean, lots of whitespace)
- Allow real-time template switching
- Ensure all templates work with PDF export
```

#### 2.1.4 Theme Customization

Allow visual customization:

```
- Primary accent color picker (using react-colorful)
- Font family selection (provide 4-6 professional options)
- Section heading style options
- Line/divider style options
- Store theme preferences in state
```

#### 2.1.5 Section Management

Enable flexible section control:

```
- Add/remove sections dynamically
- Available sections:
  - Personal Information (required)
  - Professional Summary
  - Work Experience
  - Education
  - Skills
  - Projects
  - Certifications
  - Languages
  - Volunteer Experience
  - Awards & Achievements
  - Publications
  - References
- Toggle section visibility (hide without deleting)
- Custom section creation with user-defined titles
```

#### 2.1.6 Smart Date Handling

Implement intelligent date inputs:

```
- Use react-day-picker for date selection
- Support date ranges (start date - end date)
- "Present" checkbox for current positions
- Format options (MM/YYYY, Month YYYY, YYYY only)
- Automatic date formatting in preview
```

#### 2.1.7 Skills Enhancement

Advanced skills management:

```
- Skill categories/groups
- Skill proficiency levels (optional):
  - Visual indicator (bars, dots, or percentage)
  - Or simple list without levels
- Autocomplete suggestions for common skills
- Drag-and-drop skill reordering
```

#### 2.1.8 Real-Time Preview

Enhance preview functionality:

```
- Side-by-side editor and preview (desktop)
- Toggle between edit/preview (mobile)
- Live updates as user types
- Zoom controls for preview
- Page break indicators
```

#### 2.1.9 Auto-Save & Local Storage

Implement data persistence:

```
- Auto-save to localStorage every 30 seconds
- Save on every significant change
- Restore data on page load
- Clear/reset option with confirmation
- Export/import resume data as JSON
```

#### 2.1.10 AI-Assisted Writing (Optional Enhancement)

If time permits, add AI assistance:

```
- Integration point for AI suggestions
- Improve bullet points button
- Generate summary from experience
- Keyword optimization suggestions
- Note: This may require external API integration
```

### 2.2 Dynamic Font Size Control

Implement font size adjustment functionality:

1. **Create Font Size Control Component**
   ```
   - Add a UI control (slider, dropdown, or increment buttons)
   - Define available font size options (e.g., Small, Medium, Large, or specific px/pt values)
   - Store font size preference in component state
   ```

2. **Apply Font Size to Resume Preview**
   ```
   - Pass font size as a prop or context value
   - Update resume preview typography dynamically
   - Ensure all text elements scale proportionally
   - Maintain layout integrity at different sizes
   ```

3. **Persist User Preference (Optional)**
   ```
   - Consider storing preference in localStorage
   - Restore preference on component mount
   ```

### 2.2 PDF Export Functionality

Implement true PDF file generation (not browser print dialog):

> **Important:** All PDF generation must be client-side only. No server-side code or API routes should be created.

1. **Choose a Client-Side PDF Generation Library**
   
   Recommended options:
   - **@react-pdf/renderer** — React-specific PDF generation (recommended)
   - **jsPDF** — Lightweight client-side PDF generation
   - **html2pdf.js** — HTML to PDF conversion (wrapper around jsPDF + html2canvas)

2. **Implementation Approach**

   **Option A: @react-pdf/renderer (Recommended)**
   ```
   - Create PDF-specific components that mirror the preview
   - Use @react-pdf/renderer's primitives (Document, Page, View, Text, StyleSheet)
   - Generate PDF blob client-side and trigger download
   - Provides best control over PDF styling and layout
   ```

   **Option B: jsPDF + html2canvas**
   ```
   - Capture resume preview element as canvas using html2canvas
   - Convert canvas to PDF using jsPDF
   - Ensure proper resolution (scale: 2 or higher) for print quality
   - Simpler implementation but less control over output
   ```

   **Option C: html2pdf.js**
   ```
   - Combines html2canvas and jsPDF in one library
   - Pass the resume preview element directly
   - Configure options for margins, image quality, and page format
   - Easiest implementation for HTML-to-PDF conversion
   ```

3. **PDF Quality Requirements**
   ```
   - Output must closely match on-screen design
   - Proper font embedding
   - Correct colors and spacing
   - Print-ready resolution (300 DPI recommended)
   - Proper page margins
   ```

4. **Add Download UI**
   ```
   - Create a prominent "Download PDF" button
   - Show loading state during generation
   - Handle errors gracefully
   - Consider filename customization
   ```

---

## Task 3: Code Quality & Build Validation

### 3.1 Run Code Checks

Execute the code quality check command:

```bash
bun run code:check
```

**Address all reported issues:**

1. **Linting Errors**
   - Fix ESLint violations
   - Ensure consistent code style

2. **Type Errors**
   - Resolve all TypeScript errors
   - Add proper type annotations where needed

3. **Formatting Issues**
   - Apply consistent formatting (Prettier if configured)
   - Fix any spacing or indentation issues

### 3.2 Validate Build

Execute the build command:

```bash
bun run build
```

**Ensure successful completion:**

1. **No Build Errors**
   - Fix any compilation errors
   - Resolve module resolution issues

2. **No Build Warnings** (if possible)
   - Address deprecation warnings
   - Fix any non-critical issues

3. **Verify Output**
   - Confirm the build output is generated
   - Test the built application if possible

---

## Task 4: Best Practices Implementation

### 4.1 Server vs. Client Components

Apply correct component boundaries:

| Component Type | Use For |
|----------------|---------|
| **Server Components** | Data fetching, static content, non-interactive UI |
| **Client Components** | Interactive elements, state management, event handlers, browser APIs |

**Guidelines:**

- Default to Server Components
- Add `'use client'` directive only when necessary
- Keep Client Component boundaries as small as possible
- Lift state up to minimize Client Component scope

### 4.2 Component Separation & Reuse

Structure components properly:

1. **Single Responsibility**
   - Each component should do one thing well
   - Extract complex logic into custom hooks

2. **Reusable Components**
   - Create shared UI components (Button, Input, Card, etc.)
   - Use props for customization
   - Document component APIs

### 4.3 Performance Optimization

Avoid common React anti-patterns:

1. **Prevent Unnecessary Re-renders**
   - Use `React.memo()` for expensive components
   - Memoize callbacks with `useCallback` only if necessary
   - Memoize expensive computed values with `useMemo`
   - Avoid inline object/array creation in JSX

2. **State Management**
   - Keep state as local as possible
   - Lift state only when necessary
   - Consider state colocation

3. **Key Usage**
   - Use stable, unique keys for list items
   - Never use array index as key for dynamic lists

### 4.4 Code Maintainability

Ensure long-term maintainability:

1. **Naming Conventions**
   - Use descriptive, consistent names
   - Follow existing project conventions

2. **Code Comments**
   - Document complex logic
   - Explain "why" not "what"

3. **Type Safety**
   - Use TypeScript strictly
   - Avoid `any` type
   - Define interfaces for props and state
   - Use Resume data data types from `apps/web/src/constants/dummy.ts`

---

## Output Expectations

### File Modifications

The AI should:

- Modify existing files where appropriate
- Create new files when needed for new components
- All components must reside under `src/components`, not in `app` route folder
- Remove deprecated or unused code
- Update imports and dependencies

### Documentation

For significant changes, explain:

- Architectural decisions and their rationale
- Design pattern choices
- Trade-offs considered
- Any deviations from the original plan

### Quality Assurance

All changes must be:

- **Production-ready** — No placeholder code or TODO comments
- **Consistent** — Aligned with existing project conventions
- **Tested** — Build passes, no runtime errors
- **Accessible** — Meets basic accessibility standards
- **Responsive** — Works across device sizes

---

## Checklist Summary

Before considering the work complete, verify:

- [ ] Serena MCP server activated
- [ ] Documentation retrieved via Context7
- [ ] Required libraries installed (Tiptap, @dnd-kit, react-day-picker, @react-pdf/renderer, etc.)
- [ ] Resume Builder UI completely redesigned (not just polished)
- [ ] Dashboard UI completely redesigned (not just polished)
- [ ] New UI matches landing page brand identity
- [ ] All styling uses Tailwind CSS v4
- [ ] Rich text editor implemented for description fields
- [ ] Drag-and-drop section reordering working
- [ ] Multiple resume templates available
- [ ] Theme customization (colors, fonts) implemented
- [ ] Section management (add/remove/toggle visibility) working
- [ ] Smart date handling with date picker
- [ ] Skills enhancement features implemented
- [ ] Real-time preview with live updates
- [ ] Auto-save to localStorage implemented
- [ ] Dynamic font size control implemented
- [ ] PDF export generates true PDF files (client-side only)
- [ ] PDF output matches on-screen design
- [ ] `bun run code:check` passes with no errors
- [ ] `bun run build` completes successfully
- [ ] Server/Client Components used correctly
- [ ] Components must reside under `src/components`, and are properly separated and reusable
- [ ] No unnecessary re-renders or anti-patterns
- [ ] Code is maintainable and well-organized

---

## Notes

- Always prioritize matching the existing design system from the landing page unless a a necessary change is absolutely required.
- When in doubt, reference modern SaaS applications (Vercel, Linear, Notion) for inspiration
- Test the Resume Builder and Dashboard page at multiple viewport sizes
- Ensure the PDF export works reliably across browsers
- Document any assumptions made during implementation