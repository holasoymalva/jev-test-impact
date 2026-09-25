import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fg from "fast-glob";
import ignore from "ignore";

export const SOURCE_EXTENSIONS = [
  "js",
  "jsx",
  "ts",
  "tsx",
  "mjs",
  "cjs",
  "mts",
  "cts",
];
export const DEFAULT_IGNORES = [
  ".git/**",
  "node_modules/**",
  "dist/**",
  "build/**",
  "coverage/**",
  ".next/**",
  ".cache/**",
  "tmp/**",
  "vendor/**",
  "generated/**",
];

export async function loadIgnoreMatcher(
  root: string,
  extraIgnore: string[] = [],
): Promise<ReturnType<typeof ignore>> {
  const matcher = ignore().add(DEFAULT_IGNORES).add(extraIgnore);
  for (const filename of [".gitignore", ".jev-test-impact-ignore"]) {
    try {
      matcher.add(await readFile(join(root, filename), "utf8"));
    } catch {
      /* optional */
    }
  }
  return matcher;
}

export async function scanSourceFiles(
  root: string,
  extraIgnore: string[] = [],
): Promise<string[]> {
  const matcher = await loadIgnoreMatcher(root, extraIgnore);
  const files = await fg(`**/*.{${SOURCE_EXTENSIONS.join(",")}}`, {
    cwd: root,
    onlyFiles: true,
    dot: true,
    followSymbolicLinks: false,
  });
  return files.filter((path) => !matcher.ignores(path)).sort();
}
