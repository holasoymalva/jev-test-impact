import { posix } from "node:path";
import type { Candidate, ChangeSet, TestDescriptor } from "../core/types.js";
import type { ImpactIndex } from "../repository/index.js";

function transitiveDependencies(
  file: string,
  graph: Map<string, string[]>,
  depth = 6,
): Set<string> {
  const seen = new Set<string>();
  let frontier = [file];
  for (let i = 0; i < depth; i += 1) {
    const next: string[] = [];
    for (const current of frontier)
      for (const dependency of graph.get(current) ?? [])
        if (!seen.has(dependency)) {
          seen.add(dependency);
          next.push(dependency);
        }
    frontier = next;
  }
  return seen;
}

export function generateCandidates(
  changeSet: ChangeSet,
  tests: TestDescriptor[],
  index: ImpactIndex,
  alwaysRun: string[],
  candidateThreshold: number,
): Candidate[] {
  const changed = new Set(
    changeSet.files.flatMap((file) => [
      file.path,
      ...(file.oldPath ? [file.oldPath] : []),
    ]),
  );
  return tests.flatMap((test) => {
    const relations: string[] = [];
    let score = 0;
    const mandatory = alwaysRun.some((pattern) =>
      pattern.endsWith("/**")
        ? test.path.startsWith(pattern.slice(0, -3))
        : test.path === pattern,
    );
    if (mandatory) {
      score = 1;
      relations.push("always-run");
    }
    if (
      [...changed].some((file) =>
        index.siblingTests.get(file)?.includes(test.path),
      )
    ) {
      score = Math.max(score, 1);
      relations.push("sibling");
    }
    const deps = transitiveDependencies(test.path, index.importsByFile);
    if (
      [...changed].some((file) =>
        (index.importsByFile.get(test.path) ?? []).includes(file),
      )
    ) {
      score = Math.max(score, 0.95);
      relations.push("direct-import");
    } else if ([...changed].some((file) => deps.has(file))) {
      score = Math.max(score, 0.75);
      relations.push("transitive");
    }
    const testDir = posix.dirname(test.path);
    if ([...changed].some((file) => posix.dirname(file) === testDir)) {
      score = Math.max(score, 0.3);
      relations.push("same-directory");
    }
    if (changed.has(test.path)) {
      score = 1;
      relations.push("changed-test");
    }
    return score >= candidateThreshold || mandatory
      ? [{ id: test.id, test, staticScore: score, relations, mandatory }]
      : [];
  });
}
