# Docker Commands

```sh
bun run docker:build
bun run docker:build:standalone
bun run docker:up
bun run docker:down
```

## Notes

- Default `docker-compose.yml` currently defines only the `web` service.
- Database and Redis are not enabled in Docker by default.
