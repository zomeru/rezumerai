# Module Architecture

## Elysia Module Structure

Keep Elysia feature modules thin at the route layer:

- `index.ts` handles routing, auth, and HTTP responses
- `service.ts` owns use-case orchestration and business rules
- `repository.ts` owns Prisma queries when a module has non-trivial data access
- `validation.ts` or schema files own boundary validation beyond basic route schemas
- `types.ts` owns module-local contracts and DTOs
- `providers/` owns third-party adapters for AI, email, storage, or similar integrations

## Stability

- Preserve stable service APIs when refactoring internals so other modules can adopt new boundaries incrementally.

## Client-Side Feature Organization

- For large client-side feature files, prefer a feature-local controller hook such as `hooks/use*Controller.ts` plus nearby `constants.ts` and `utils/` files instead of keeping data orchestration inside the render component.
