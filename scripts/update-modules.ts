type UpdateCommand = (cwd: string, target: string) => Promise<void>;

const EXCLUDED_WORKSPACES = new Set(["packages/tsconfig"]);
const WORKSPACE_PATTERNS = ["apps/*/package.json", "packages/*/package.json"];

function toWorkspaceDirectory(packageJsonPath: string): string {
  return packageJsonPath.replace(/\/package\.json$/, "");
}

export function buildUpdateTargets(workspaces: string[]): string[] {
  const apps = workspaces.filter((workspace) => workspace.startsWith("apps/")).sort();
  const packages = workspaces.filter((workspace) => workspace.startsWith("packages/")).sort();

  return [".", ...apps, ...packages];
}

export async function findWorkspaceUpdateTargets(rootDir: string): Promise<string[]> {
  const discovered = new Set<string>();

  for (const pattern of WORKSPACE_PATTERNS) {
    const glob = new Bun.Glob(pattern);

    for await (const packageJsonPath of glob.scan({ cwd: rootDir, onlyFiles: true })) {
      const workspace = toWorkspaceDirectory(packageJsonPath);

      if (!EXCLUDED_WORKSPACES.has(workspace)) {
        discovered.add(workspace);
      }
    }
  }

  return [...discovered].sort();
}

async function runBunUpdate(cwd: string, target: string): Promise<void> {
  console.log(`\n📦 Updating ${target}`);

  const proc = Bun.spawn({
    cmd: ["bun", "update", "--latest"],
    cwd,
    stdout: "inherit",
    stderr: "inherit",
  });

  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    throw new Error(`Failed to update ${target} (exit code ${exitCode})`);
  }
}

export async function runWorkspaceUpdates(
  targets: string[],
  options: {
    rootDir: string;
    runCommand?: UpdateCommand;
  },
): Promise<void> {
  const runCommand = options.runCommand ?? runBunUpdate;

  for (const target of targets) {
    const cwd = target === "." ? options.rootDir : `${options.rootDir}/${target}`;
    await runCommand(cwd, target);
  }
}

export async function updateModules(rootDir = process.cwd()): Promise<void> {
  const workspaces = await findWorkspaceUpdateTargets(rootDir);
  const targets = buildUpdateTargets(workspaces);

  await runWorkspaceUpdates(targets, { rootDir });
}

if (import.meta.main) {
  updateModules().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
