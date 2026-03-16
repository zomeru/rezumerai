# Build, Lint, Format, And Test Commands

## Root Commands

Use `rtk` for all commands to minimize terminal verbosity and preserve agent context tokens.

```sh
rtk bun install
rtk bun run dev
rtk bun run build
rtk bun run build:production
rtk bun run build:packages
rtk bun run start
rtk bun run check
rtk bun run biome
rtk bun run check:types
rtk bun run code:check
rtk bun run test
rtk bun run test:watch
rtk bun run test:coverage
rtk bun run code:verify
```

### Important Behavior

- `rtk bun run check` runs `update:biome-configs` first, then `turbo check`.
- `rtk bun run biome` and many workspace `check` scripts write formatting fixes in place.
- `rtk bun run code:verify` is the main full-repo verification command.

## Useful Maintenance Commands

```sh
rtk bun run install:modules
rtk bun run update:modules:1
rtk bun run update:modules:2
rtk bun run assistant:reindex-memory
rtk bun run clean
rtk bun run clean:install
rtk bun run outdated
rtk bun run security:audit
rtk bun run security:check
```
