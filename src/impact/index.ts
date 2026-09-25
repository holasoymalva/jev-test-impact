import { thresholdFor } from "../config/config.js";
import type { ResolvedConfig } from "../config/schema.js";
import type {
  ImpactDecisionEngine,
  ImpactSelection,
  SelectedTest,
  TestDescriptor,
} from "../core/types.js";
import { GitDiffProvider } from "../git/diff-provider.js";
import { buildImpactIndex } from "../repository/index.js";
import { discoverTests } from "../tests/discovery.js";
import { generateCandidates } from "./candidates.js";
import { shouldRunFullSuite } from "./policy.js";

export interface SelectionOptions {
  root: string;
  base?: string;
  head?: string;
  config: ResolvedConfig;
  engine?: ImpactDecisionEngine;
  static?: boolean;
  full?: boolean;
  signal?: AbortSignal;
}

function selectAll(
  tests: TestDescriptor[],
  reason: "safety" | "fallback",
): SelectedTest[] {
  return tests.map((test) => ({
    test,
    score: 1,
    staticScore: 1,
    reason,
    relations: [reason],
  }));
}

export async function selectImpactedTestsInternal(
  options: SelectionOptions,
): Promise<ImpactSelection> {
  const started = performance.now();
  const changeSet = await new GitDiffProvider().getChangeSet({
    root: options.root,
    ...(options.base ? { base: options.base } : {}),
    ...(options.head ? { head: options.head } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  });
  const tests = await discoverTests(
    options.root,
    options.config.testPatterns,
    options.config.ignore,
  );
  if (options.full || shouldRunFullSuite(changeSet)) {
    const selected = selectAll(tests, "safety");
    return {
      changeSet,
      selected,
      skipped: [],
      fullSuite: true,
      fallbackUsed: false,
      metrics: {
        testsDiscovered: tests.length,
        candidates: tests.length,
        selected: tests.length,
        skipped: 0,
        selectionMs: performance.now() - started,
        jevRequests: 0,
      },
    };
  }
  const index = await buildImpactIndex(
    options.root,
    tests,
    options.config.ignore,
    changeSet.files.flatMap((file) => [
      file.path,
      ...(file.oldPath ? [file.oldPath] : []),
    ]),
  );
  const candidates = generateCandidates(
    changeSet,
    tests,
    index,
    options.config.alwaysRun,
    options.config.selection.candidateThreshold,
  );
  const mandatory = candidates.filter(
    (candidate) => candidate.mandatory || candidate.staticScore >= 0.95,
  );
  const semantic = candidates.filter(
    (candidate) => !mandatory.includes(candidate),
  );
  let fallbackUsed = false;
  let scores = new Map<string, number>();
  if (options.static || !options.engine)
    scores = new Map(
      semantic.map((candidate) => [candidate.id, candidate.staticScore]),
    );
  else {
    try {
      scores = new Map(
        (
          await options.engine.scoreTests({
            changeSet,
            candidates: semantic,
            ...(options.signal ? { signal: options.signal } : {}),
          })
        ).map((score) => [score.id, score.score]),
      );
    } catch (error) {
      if (options.config.fallback === "error") throw error;
      fallbackUsed = true;
      if (options.config.fallback === "full-suite") {
        const selected = selectAll(tests, "fallback");
        return {
          changeSet,
          selected,
          skipped: [],
          fullSuite: true,
          fallbackUsed,
          metrics: {
            testsDiscovered: tests.length,
            candidates: candidates.length,
            selected: tests.length,
            skipped: 0,
            selectionMs: performance.now() - started,
            jevRequests: Math.ceil(
              semantic.length / options.config.jev.batchSize,
            ),
          },
        };
      }
      scores = new Map(semantic.map((candidate) => [candidate.id, 1]));
    }
  }
  const selected: SelectedTest[] = mandatory.map((candidate) => ({
    test: candidate.test,
    score: 1,
    staticScore: candidate.staticScore,
    reason: candidate.mandatory ? "mandatory" : "direct",
    relations: candidate.relations,
  }));
  for (const candidate of semantic) {
    const score = scores.get(candidate.id) ?? 0;
    if (score >= thresholdFor(options.config))
      selected.push({
        test: candidate.test,
        score,
        staticScore: candidate.staticScore,
        ...(!options.static ? { jevScore: score } : {}),
        reason: fallbackUsed ? "fallback" : options.static ? "direct" : "jev",
        relations: candidate.relations,
      });
  }
  const selectedPaths = new Set(selected.map((item) => item.test.path));
  const skipped = tests.filter((test) => !selectedPaths.has(test.path));
  return {
    changeSet,
    selected,
    skipped,
    fullSuite: false,
    fallbackUsed,
    metrics: {
      testsDiscovered: tests.length,
      candidates: candidates.length,
      selected: selected.length,
      skipped: skipped.length,
      selectionMs: performance.now() - started,
      jevRequests:
        options.static || !options.engine
          ? 0
          : Math.ceil(semantic.length / options.config.jev.batchSize),
    },
  };
}
