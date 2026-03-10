# Project Overview

Rezumerai is an AI-powered resume builder organized as a Bun workspace monorepo with Turborepo. The main application lives in `apps/web`, which serves both the Next.js frontend and an embedded Elysia API.

## Main Technologies

- Bun `1.3.x` for package management, runtime, and tests
- Turborepo `2.x` for workspace orchestration
- Next.js `16` App Router with React `19`
- Elysia for the API layer
- Better Auth for authentication
- Prisma `7` with PostgreSQL
- OpenRouter for model and embedding access
- Mastra for the assistant agent and memory layer
- Zod for shared schemas
- Zustand and TanStack Query on the frontend
- Tailwind CSS `4`
- Biome for formatting and linting
- React Testing Library with Happy DOM

## Product Areas

- Resume dashboard, builder, preview, and PDF export
- AI Copilot flows for optimize, tailor, and review
- AI assistant with public, user, and admin scopes
- Admin console for users, AI models, system config, analytics, audit logs, and errors
- Database-backed public content for landing, FAQ, about, contact, privacy, and terms pages
