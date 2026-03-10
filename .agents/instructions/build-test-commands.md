# Build, Lint, Format, And Test Commands

## Root Commands

```sh
bun install
bun run dev
bun run build
bun run build:production
bun run build:packages
bun run start
bun run check
bun run biome
bun run check:types
bun run code:check
bun run test
bun run test:watch
bun run test:coverage
bun run code:verify
```

### Important Behavior

- `bun run check` runs `update:biome-configs` first, then `turbo check`.
- `bun run biome` and many workspace `check` scripts write formatting fixes in place.
- `bun run code:verify` is the main full-repo verification command.

## Useful Maintenance Commands

```sh
bun run install:modules
bun run update:modules:1
bun run update:modules:2
bun run assistant:reindex-memory
bun run clean
bun run clean:install
bun run outdated
bun run security:audit
bun run security:check
```
