# Testing Guidelines

## Frameworks And Locations

- Test runner: Bun (`rtk bun test`)
- React and component tests: React Testing Library with Happy DOM preload
- Current Bun test preload config lives in:
  - `apps/web/bunfig.toml`
  - `packages/ui/bunfig.toml`
  - `packages/utils/bunfig.toml`
- Keep tests colocated in `__tests__` directories where that pattern already exists
- CI workflow reference: `.github/workflows/main.yml`

Use `rtk` for all commands to minimize terminal verbosity and preserve agent context tokens.

## Default Verification For Code Changes

For implementation changes, run:

```sh
rtk bun run check
rtk bun run check:types
rtk bun run test
rtk bun run build
```

Or run:

```sh
rtk bun run code:verify
```

If schema or model changes were made, also run:

```sh
rtk bun run db:generate
# and/or
rtk bun run db:migrate:dev
```

## Browser Testing

Use the existing development server on port `3000` for browser automation, including Playwright MCP.

Development test accounts:

- User email: `test@test.com`
- User password: `Test1234`
- Admin email: `testadmin@test.com`
- Admin password: `Test1234`

### Notes

- Ensure the dev server is running before browser tests.
- These credentials are for local automated testing and role-based validation only.
