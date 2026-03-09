# Monorepo And Nested AGENTS.md Guidance

- The root `AGENTS.md` governs the repository by default.
- A deeper `AGENTS.md` closer to the edited file takes precedence for that subtree.
- Keep nested files focused on local workflow, commands, and conventions. Do not duplicate all root guidance.
- If a package or app gains unique instructions, add a local `AGENTS.md` there instead of overloading the root file.
- Agents should always prioritize the nearest `AGENTS.md` in the directory tree.
- Current state: there is no package-level `AGENTS.md` under `apps/` or `packages/`. Existing nested `AGENTS.md` files inside `.agents/skills/` apply only to those skill directories.
