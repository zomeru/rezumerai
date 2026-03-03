import path from "node:path";

/**
 * Per-workspace lint-staged config for Biome in a Turborepo monorepo.
 *
 * Why this exists:
 *   1. Biome resolves biome.json from the CWD — running from the monorepo root
 *      would always use the root config, missing workspace-specific overrides
 *      (e.g. packages/ui adds React linting rules).
 *   2. lint-staged passes absolute/root-relative file paths as arguments. Once
 *      we `cd` into a workspace, those paths no longer resolve. We must convert
 *      them to paths relative to the workspace directory first.
 *
 * Solution: group staged files by workspace, then for each workspace emit a
 * `bash -c "cd <workspace> && biome check --write <relative-files>"` command.
 */

/** @param {string[]} filenames @param {string} dir @returns {string} */
const biomeCmdForDir = (filenames, dir) => {
  const relativeFiles = filenames
    .map((f) => path.relative(dir, f))
    .map((f) => `'${f}'`)
    .join(" ");
  return `bash -c "cd ${dir} && biome check --write --no-errors-on-unmatched ${relativeFiles}"`;
};

/** @param {string[]} filenames @param {RegExp} re @returns {Record<string, string[]>} */
const groupByWorkspace = (filenames, re) =>
  filenames.reduce((acc, f) => {
    const m = f.match(re);
    if (!m) return acc;
    const key = m[1];
    if (!acc[key]) acc[key] = [];
    acc[key].push(f);
    return acc;
  }, {});

export default {
  // ── apps/* ────────────────────────────────────────────────────────────────
  "apps/**/*.{js,jsx,ts,tsx,json,css,md}": (filenames) => {
    const groups = groupByWorkspace(filenames, /(?:^|\/)apps\/([^/]+)\//);
    return Object.entries(groups).map(([app, files]) => biomeCmdForDir(files, `apps/${app}`));
  },

  // ── packages/* ────────────────────────────────────────────────────────────
  "packages/**/*.{js,jsx,ts,tsx,json}": (filenames) => {
    const groups = groupByWorkspace(filenames, /(?:^|\/)packages\/([^/]+)\//);
    return (
      Object.entries(groups)
        // tsconfig package only ships .json config files — no Biome setup needed
        .filter(([pkg]) => pkg !== "tsconfig")
        .map(([pkg, files]) => biomeCmdForDir(files, `packages/${pkg}`))
    );
  },

  // ── root-level files ──────────────────────────────────────────────────────
  "*.{js,mjs,cjs,ts,json,md,yaml,yml}": ["biome check --write --no-errors-on-unmatched"],
};
