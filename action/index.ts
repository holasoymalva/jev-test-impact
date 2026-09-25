import * as core from "@actions/core";
import { runImpactedTests, selectImpactedTests } from "../src/index.js";

async function run() {
  try {
    const apiKey = core.getInput("typesafe-api-key");
    if (apiKey) {
      core.setSecret(apiKey);
      process.env.TYPESAFE_API_KEY = apiKey;
    }
    const base = core.getInput("base");
    const mode = core.getInput("mode") as "safe" | "balanced" | "aggressive";
    const threshold = core.getInput("threshold");
    const selectOnly = core.getBooleanInput("select-only");
    const failOnApiError = core.getBooleanInput("fail-on-api-error");
    const common = {
      ...(base ? { base } : {}),
      ...(mode ? { mode } : {}),
      ...(threshold ? { selection: { threshold: Number(threshold) } } : {}),
      ...(failOnApiError ? { fallback: "error" as const } : {}),
    };
    const execution = selectOnly ? undefined : await runImpactedTests(common);
    const selection =
      execution?.selection ?? (await selectImpactedTests(common));
    if (execution && execution.result.exitCode !== 0)
      throw new Error(
        `Selected test suite failed with exit code ${execution.result.exitCode}`,
      );
    const reduction =
      selection.metrics.testsDiscovered === 0
        ? 0
        : (1 - selection.metrics.selected / selection.metrics.testsDiscovered) *
          100;
    core.setOutput("selected-count", selection.metrics.selected);
    core.setOutput("discovered-count", selection.metrics.testsDiscovered);
    core.setOutput("candidate-count", selection.metrics.candidates);
    core.setOutput("reduction-percent", reduction.toFixed(1));
    core.setOutput("selection-ms", Math.round(selection.metrics.selectionMs));
    core.setOutput(
      "selected-tests",
      JSON.stringify(selection.selected.map((item) => item.test.path)),
    );
    await core.summary
      .addHeading("jev-test-impact ⚡")
      .addTable([
        [
          { data: "Metric", header: true },
          { data: "Value", header: true },
        ],
        ["Tests discovered", String(selection.metrics.testsDiscovered)],
        ["Candidates", String(selection.metrics.candidates)],
        ["Tests selected", String(selection.metrics.selected)],
        ["Reduction", `${reduction.toFixed(1)}%`],
        ["Selection time", `${Math.round(selection.metrics.selectionMs)}ms`],
      ])
      .addHeading("Selected files", 3)
      .addList(selection.selected.map((item) => item.test.path))
      .write();
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}

void run();
