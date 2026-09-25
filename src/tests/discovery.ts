import { readFile } from "node:fs/promises";
import { join } from "node:path";
import fg from "fast-glob";
import type { TestDescriptor, TestFramework } from "../core/types.js";
import { extractImports } from "../repository/imports.js";
import { DEFAULT_IGNORES, loadIgnoreMatcher } from "../repository/scanner.js";

export const TEST_PATTERNS = [
  "**/*.test.{ts,tsx,js,jsx,mts,cts,mjs,cjs}",
  "**/*.spec.{ts,tsx,js,jsx,mts,cts,mjs,cjs}",
  "**/__tests__/**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}",
];

export async function detectFramework(root: string): Promise<TestFramework> {
  let pkg = "";
  try {
    pkg = await readFile(join(root, "package.json"), "utf8");
  } catch {
    /* use config signals */
  }
  if (
    /vitest/.test(pkg) ||
    (await fg("vitest.config.*", { cwd: root })).length > 0
  )
    return "vitest";
  if (/jest/.test(pkg) || (await fg("jest.config.*", { cwd: root })).length > 0)
    return "jest";
  return "vitest";
}

export async function discoverTests(
  root: string,
  patterns = TEST_PATTERNS,
  extraIgnore: string[] = [],
): Promise<TestDescriptor[]> {
  const framework = await detectFramework(root);
  const matcher = await loadIgnoreMatcher(root, extraIgnore);
  const paths = await fg(patterns, {
    cwd: root,
    onlyFiles: true,
    unique: true,
    ignore: [...DEFAULT_IGNORES, ...extraIgnore],
    followSymbolicLinks: false,
  });
  return await Promise.all(
    paths
      .filter((path) => !matcher.ignores(path))
      .sort()
      .map(async (path, index) => {
        let source = "";
        try {
          source = await readFile(join(root, path), "utf8");
        } catch {
          /* descriptor remains usable */
        }
        return {
          id: String(index + 1).padStart(4, "0"),
          path,
          framework,
          imports: extractImports(source),
        };
      }),
  );
}
