#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import pc from "picocolors";
import { benchmark } from "../benchmark/benchmark.js";
import { loadConfig } from "../config/config.js";
import { GitDiffProvider } from "../git/diff-provider.js";
import { selectImpactedTests } from "../index.js";
import { runTests } from "../runner/executor.js";
import { detectPackageManager } from "../runner/package-manager.js";
import { detectFramework, discoverTests } from "../tests/discovery.js";

const argv = process.argv.slice(2);
const knownCommands = new Set([
  "run",
  "select",
  "explain",
  "benchmark",
  "doctor",
  "init",
  "help",
]);
const command = knownCommands.has(argv[0] ?? "")
  ? (argv.shift() as string)
  : "run";
const has = (flag: string) => argv.includes(flag);
const value = (flag: string) => {
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
};
const root = value("--root") ?? process.cwd();
const base = value("--base");
const mode = value("--mode") as "safe" | "balanced" | "aggressive" | undefined;
const thresholdValue = value("--threshold");
const json = has("--json");
const controller = new AbortController();
process.once("SIGINT", () => controller.abort());

const options = {
  root,
  ...(base ? { base } : {}),
  ...(mode ? { mode } : {}),
  ...(thresholdValue
    ? { selection: { threshold: Number(thresholdValue) } }
    : {}),
  ...(has("--static") ? { static: true } : {}),
  ...(has("--full") ? { full: true } : {}),
  signal: controller.signal,
};

function selectionJson(
  selection: Awaited<ReturnType<typeof selectImpactedTests>>,
) {
  return {
    base: selection.changeSet.baseRef,
    changedFiles: selection.changeSet.files.length,
    ...selection.metrics,
    fullSuite: selection.fullSuite,
    fallbackUsed: selection.fallbackUsed,
    selected: selection.selected.map((item) => ({
      path: item.test.path,
      score: item.score,
      reason: item.reason,
      relations: item.relations,
    })),
  };
}

function summary(selection: Awaited<ReturnType<typeof selectImpactedTests>>) {
  console.log(`${pc.bold("jev-test-impact")} ${pc.yellow("⚡")}\n`);
  console.log(
    `Diff\n  base        ${selection.changeSet.baseRef}\n  files       ${selection.changeSet.files.length}\n`,
  );
  console.log(
    `Tests\n  discovered  ${selection.metrics.testsDiscovered}\n  candidates  ${selection.metrics.candidates}\n  selected    ${selection.metrics.selected}\n`,
  );
  console.log(
    `Selection     ${Math.round(selection.metrics.selectionMs)}ms${selection.fallbackUsed ? " (safe fallback)" : ""}`,
  );
}

async function main() {
  if (command === "help") {
    console.log(
      "jev-test-impact ⚡\n\nUsage: jti [run|select|explain|benchmark|doctor|init] [--base ref] [--static] [--full] [--json]",
    );
    return;
  }
  if (command === "init") {
    const target = join(root, "jev-test-impact.config.ts");
    await writeFile(
      target,
      'import { defineConfig } from "jev-test-impact";\n\nexport default defineConfig({\n  mode: "safe",\n  fallback: "candidates",\n  alwaysRun: [],\n});\n',
      { flag: "wx" },
    );
    console.log(`Created ${target}`);
    return;
  }
  if (command === "doctor") {
    const checks: Array<[string, () => Promise<unknown>]> = [
      ["Git repository", () => new GitDiffProvider().resolveBase(root, base)],
      ["Package manager", () => detectPackageManager(root)],
      ["Vitest/Jest", () => detectFramework(root)],
      [
        "Test discovery",
        async () => `${(await discoverTests(root)).length} files`,
      ],
      ["Configuration", () => loadConfig(root)],
    ];
    let failed = false;
    for (const [label, check] of checks)
      try {
        console.log(`${pc.green("✓")} ${label}: ${String(await check())}`);
      } catch (error) {
        failed = true;
        console.log(
          `${pc.red("✗")} ${label}: ${error instanceof Error ? error.message : error}`,
        );
      }
    console.log(
      process.env.TYPESAFE_API_KEY
        ? `${pc.green("✓")} TYPESAFE_API_KEY`
        : `${pc.yellow("!")} TYPESAFE_API_KEY not set (static mode available)`,
    );
    if (failed) process.exitCode = 1;
    return;
  }
  if (command === "benchmark") {
    const result = await benchmark(options, has("--verify"));
    if (json) console.log(JSON.stringify(result, null, 2));
    else {
      summary(result.selection);
      console.log(
        `\nBaselines\n  full files    ${result.selection.metrics.testsDiscovered}\n  static files  ${result.staticSelection.metrics.selected}\n  Jev files     ${result.selection.metrics.selected}`,
      );
      console.log(`\nReduction     ${result.reductionPercent.toFixed(1)}%`);
      if (result.regressionRecall !== undefined)
        console.log(
          `Regression recall  ${result.regressionRecall.toFixed(1)}%\nStatic recall      ${result.staticRegressionRecall?.toFixed(1)}%\nSelected suite     ${Math.round(result.selectedRun?.durationMs ?? 0)}ms\nStatic suite       ${Math.round(result.staticRun?.durationMs ?? 0)}ms\nFull suite         ${Math.round(result.fullRun?.durationMs ?? 0)}ms`,
        );
    }
    if ((result.selectedRun?.exitCode ?? 0) !== 0)
      process.exitCode = result.selectedRun?.exitCode;
    return;
  }
  const selection = await selectImpactedTests(options);
  if (command === "select") {
    if (json) console.log(JSON.stringify(selectionJson(selection), null, 2));
    else {
      summary(selection);
      for (const item of selection.selected) console.log(item.test.path);
    }
    return;
  }
  if (command === "explain") {
    if (json) console.log(JSON.stringify(selectionJson(selection), null, 2));
    else {
      summary(selection);
      for (const item of selection.selected)
        console.log(
          `\n${item.test.path}\n  static: ${item.staticScore?.toFixed(2) ?? "n/a"} (${item.relations?.join(", ") || "none"})\n  Jev:   ${item.jevScore?.toFixed(2) ?? "n/a"}\n  selected: yes (${item.reason})`,
        );
      for (const test of selection.skipped)
        console.log(`\n${test.path}\n  selected: no`);
    }
    return;
  }
  summary(selection);
  console.log("\nRunning selected tests...\n");
  const result = await runTests(
    root,
    selection.selected.map((item) => item.test),
    selection.fullSuite,
    controller.signal,
  );
  console.log(
    `\n${result.exitCode === 0 ? pc.green("✓") : pc.red("✗")} ${selection.metrics.selected} test files finished in ${(result.durationMs / 1000).toFixed(1)}s`,
  );
  process.exitCode = result.exitCode;
}

main().catch((error) => {
  console.error(pc.red(error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
