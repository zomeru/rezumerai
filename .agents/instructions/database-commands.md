# Database Commands

```sh
bun run db:setup
bun run db:generate
bun run db:push
bun run db:migrate
bun run db:migrate:dev
bun run db:migrate:status
bun run db:seed
bun run db:seed:ai
bun run db:pull
bun run db:studio
bun run db:reset
```

## Notes

- After schema or model changes, run `bun run db:generate` and/or `bun run db:migrate:dev`.
- Source of truth for env validation (including `DATABASE_URL`): `apps/web/src/env.ts`.
- Prisma schema lives in `packages/database/prisma/`.
- Generated client output lives in `packages/database/generated/` — do not edit manually.
