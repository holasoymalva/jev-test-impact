import type { PublicOptions } from "../index.js";
import { selectImpactedTests } from "../index.js";
import { runTests } from "../runner/executor.js";

export interface BenchmarkResult {
  selection: Awaited<ReturnType<typeof selectImpactedTests>>;
  staticSelection: Awaited<ReturnType<typeof selectImpactedTests>>;
  selectedRun?: Awaited<ReturnType<typeof runTests>>;
  staticRun?: Awaited<ReturnType<typeof runTests>>;
  fullRun?: Awaited<ReturnType<typeof runTests>>;
  regressionRecall?: number;
  staticRegressionRecall?: number;
  reductionPercent: number;
  timeReductionPercent?: number;
}

export async function benchmark(
  options: PublicOptions,
  verify: boolean,
): Promise<BenchmarkResult> {
  const root = options.root ?? process.cwd();
  const [selection, staticSelection] = await Promise.all([
    selectImpactedTests(options),
    selectImpactedTests({ ...options, static: true }),
  ]);
  const reductionPercent =
    selection.metrics.testsDiscovered === 0
      ? 0
      : (1 - selection.metrics.selected / selection.metrics.testsDiscovered) *
        100;
  if (!verify) return { selection, staticSelection, reductionPercent };
  const selectedRun = await runTests(
    root,
    selection.selected.map((item) => item.test),
    false,
    options.signal,
  );
  const fullRun = await runTests(
    root,
    selection.selected.map((item) => item.test),
    true,
    options.signal,
  );
  const staticRun = await runTests(
    root,
    staticSelection.selected.map((item) => item.test),
    staticSelection.fullSuite,
    options.signal,
  );
  const fullCaught = fullRun.exitCode !== 0;
  const regressionRecall = fullCaught
    ? selectedRun.exitCode !== 0
      ? 100
      : 0
    : 100;
  const staticRegressionRecall = fullCaught
    ? staticRun.exitCode !== 0
      ? 100
      : 0
    : 100;
  const timeReductionPercent =
    fullRun.durationMs === 0
      ? 0
      : (1 - selectedRun.durationMs / fullRun.durationMs) * 100;
  return {
    selection,
    staticSelection,
    selectedRun,
    staticRun,
    fullRun,
    regressionRecall,
    staticRegressionRecall,
    reductionPercent,
    timeReductionPercent,
  };
}
