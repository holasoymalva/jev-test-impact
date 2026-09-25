import { access } from "node:fs/promises";
import { join } from "node:path";

export type PackageManager = "pnpm" | "yarn" | "npm" | "bun";
export async function detectPackageManager(
  root: string,
): Promise<PackageManager> {
  for (const [file, manager] of [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["package-lock.json", "npm"],
    ["bun.lock", "bun"],
    ["bun.lockb", "bun"],
  ] as const) {
    try {
      await access(join(root, file));
      return manager;
    } catch {
      /* next */
    }
  }
  return "npm";
}
