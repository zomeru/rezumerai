# Database Commands

Use `rtk` for all commands to minimize terminal verbosity and preserve agent context tokens.

```sh
rtk bun run db:setup
rtk bun run db:generate
rtk bun run db:push
rtk bun run db:migrate
rtk bun run db:migrate:dev
rtk bun run db:migrate:status
rtk bun run db:bootstrap:system
rtk bun run db:seed
rtk bun run db:seed:system
rtk bun run db:pull
rtk bun run db:psql
rtk bun run db:inspect-vectors
rtk bun run db:studio
rtk bun run db:reset
rtk bun run assistant:reindex-memory
```

## Notes

- After schema or model changes, run `rtk bun run db:generate` and/or `rtk bun run db:migrate:dev`.
- Source of truth for env validation (including `DATABASE_URL`): `apps/web/src/env.ts`.
- Prisma schema lives in `packages/database/prisma/`.
- Prisma models are split across `packages/database/prisma/models/*.prisma`.
- Generated client output lives in `packages/database/generated/` — do not edit manually.
- `rtk bun run db:migrate` runs `prisma migrate deploy` and then bootstraps any missing required system configuration and public content rows.
- `rtk bun run db:bootstrap:system` generates Prisma client artifacts and then creates missing required system configuration rows without overwriting existing values.
- `rtk bun run db:seed:system` is the development reset path for rewriting required system configuration and public content to the current defaults.
- Assistant memory embeddings use PostgreSQL + `pgvector`; inspect them with `rtk bun run db:inspect-vectors`.
