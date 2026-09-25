import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { TestDescriptor } from "../core/types.js";
import { extractImports } from "./imports.js";
import { resolveImport } from "./resolver.js";
import { scanSourceFiles } from "./scanner.js";

export interface ImpactIndex {
  importsByFile: Map<string, string[]>;
  importersByFile: Map<string, string[]>;
  testsBySourceFile: Map<string, string[]>;
  siblingTests: Map<string, string[]>;
}

export async function buildImpactIndex(
  root: string,
  tests: TestDescriptor[],
  ignores: string[] = [],
  additionalKnown: string[] = [],
): Promise<ImpactIndex> {
  const files = await scanSourceFiles(root, ignores);
  const known = new Set([...files, ...additionalKnown]);
  const importsByFile = new Map<string, string[]>();
  const importersByFile = new Map<string, string[]>();
  for (const file of files) {
    let source = "";
    try {
      source = await readFile(join(root, file), "utf8");
    } catch {
      continue;
    }
    const resolved = extractImports(source)
      .map((item) => resolveImport(file, item, known))
      .filter((item): item is string => Boolean(item));
    importsByFile.set(file, resolved);
    for (const dependency of resolved)
      importersByFile.set(dependency, [
        ...(importersByFile.get(dependency) ?? []),
        file,
      ]);
  }
  const testsBySourceFile = new Map<string, string[]>();
  for (const test of tests)
    for (const source of importsByFile.get(test.path) ?? [])
      testsBySourceFile.set(source, [
        ...(testsBySourceFile.get(source) ?? []),
        test.path,
      ]);
  const siblingTests = new Map<string, string[]>();
  for (const source of files.filter(
    (file) => !tests.some((test) => test.path === file),
  )) {
    const stem = source.replace(/\.[^.]+$/, "");
    const siblings = tests
      .filter(
        (test) => test.path.replace(/\.(?:test|spec)\.[^.]+$/, "") === stem,
      )
      .map((test) => test.path);
    if (siblings.length) siblingTests.set(source, siblings);
  }
  return { importsByFile, importersByFile, testsBySourceFile, siblingTests };
}
