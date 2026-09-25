import { spawn } from "node:child_process";
import { realpath } from "node:fs/promises";
import { isAbsolute, join, relative } from "node:path";
import { RunnerError } from "../core/errors.js";
import type { TestDescriptor, TestRunResult } from "../core/types.js";
import { detectPackageManager } from "./package-manager.js";

async function validatePaths(
  root: string,
  tests: TestDescriptor[],
): Promise<void> {
  const actualRoot = await realpath(root);
  for (const test of tests) {
    if (isAbsolute(test.path))
      throw new RunnerError(`Absolute test path rejected: ${test.path}`);
    const actual = await realpath(join(root, test.path));
    const rel = relative(actualRoot, actual);
    if (rel.startsWith("..") || isAbsolute(rel))
      throw new RunnerError(`Test path escapes repository: ${test.path}`);
  }
}

export async function runTests(
  root: string,
  tests: TestDescriptor[],
  all = false,
  signal?: AbortSignal,
): Promise<TestRunResult> {
  if (!all && tests.length === 0)
    return { exitCode: 0, durationMs: 0, command: "no tests selected" };
  await validatePaths(root, tests);
  const framework = tests[0]?.framework ?? "vitest";
  const manager = await detectPackageManager(root);
  const runnerArgs =
    framework === "vitest"
      ? ["vitest", "run", ...(!all ? tests.map((test) => test.path) : [])]
      : [
          "jest",
          "--runInBand",
          ...(!all
            ? ["--runTestsByPath", ...tests.map((test) => test.path)]
            : []),
        ];
  const [command, args] =
    manager === "pnpm"
      ? ["pnpm", ["exec", ...runnerArgs]]
      : manager === "yarn"
        ? ["yarn", runnerArgs]
        : manager === "bun"
          ? ["bunx", runnerArgs]
          : ["npx", ["--no-install", ...runnerArgs]];
  const started = performance.now();
  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      shell: false,
      stdio: "inherit",
      signal,
    });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
  return {
    exitCode,
    durationMs: performance.now() - started,
    command: [command, ...args].join(" "),
  };
}
