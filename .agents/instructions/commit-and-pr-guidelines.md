# Commit And Pull Request Guidelines

## Commits

- Prefer concise, imperative commit subjects.
- Conventional prefixes such as `feat:`, `fix:`, and `chore:` are common in this repo and preferred when they fit.
- Keep commits focused. Include code, docs, schema, and generated artifacts together when they are part of the same logical change.
- If a package release or published package surface changes, use Changesets when the task calls for versioning work.

## Pull Requests

- Summarize the user-visible or developer-visible impact.
- List the workspaces and major paths changed.
- Call out env, auth, schema, migration, or generated-client changes explicitly.
- Include the commands you ran, or state what you could not run.
- Include screenshots or short recordings for meaningful UI changes.

## Code Review Expectations

- Prioritize correctness, regressions, security, and missing tests.
- Review changes in the context of workspace boundaries and shared package reuse.
- Prefer small, reviewable diffs over broad cleanup.
