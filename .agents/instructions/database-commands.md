# Database Commands

```sh
bun run db:setup
bun run db:generate
bun run db:push
bun run db:migrate
bun run db:migrate:dev
bun run db:migrate:status
bun run db:seed
bun run db:seed:system
bun run db:pull
bun run db:psql
bun run db:inspect-vectors
bun run db:studio
bun run db:reset
bun run assistant:reindex-memory
```

## Notes

- After schema or model changes, run `bun run db:generate` and/or `bun run db:migrate:dev`.
- Source of truth for env validation (including `DATABASE_URL`): `apps/web/src/env.ts`.
- Prisma schema lives in `packages/database/prisma/`.
- Prisma models are split across `packages/database/prisma/models/*.prisma`.
- Generated client output lives in `packages/database/generated/` — do not edit manually.
- `bun run db:seed:system` seeds default system configuration and public content.
- Assistant memory embeddings use PostgreSQL + `pgvector`; inspect them with `bun run db:inspect-vectors`.
