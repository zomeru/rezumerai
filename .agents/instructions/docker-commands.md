# Docker Commands

Use `rtk` for all commands to minimize terminal verbosity and preserve agent context tokens.

```sh
rtk bun run docker:build
rtk bun run docker:build:standalone
rtk bun run docker:up
rtk bun run docker:down
```

## Notes

- Default `docker-compose.yml` currently defines only the `web` service.
- Database and Redis are not enabled in Docker by default.
