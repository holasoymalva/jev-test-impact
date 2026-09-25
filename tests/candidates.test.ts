import { describe, expect, it } from "vitest";
import type { ChangeSet, TestDescriptor } from "../src/core/types.js";
import { generateCandidates } from "../src/impact/candidates.js";
import { shouldRunFullSuite } from "../src/impact/policy.js";

const changes: ChangeSet = {
  baseRef: "main",
  headRef: "HEAD",
  packages: [],
  files: [{ path: "src/auth.ts", status: "modified" }],
};
const tests: TestDescriptor[] = [
  { id: "1", path: "src/auth.test.ts", framework: "vitest" },
  { id: "2", path: "other/other.test.ts", framework: "vitest" },
];

describe("candidate selection", () => {
  it("scores sibling/direct tests and excludes unrelated tests", () => {
    const result = generateCandidates(
      changes,
      tests,
      {
        importsByFile: new Map([["src/auth.test.ts", ["src/auth.ts"]]]),
        importersByFile: new Map(),
        testsBySourceFile: new Map(),
        siblingTests: new Map([["src/auth.ts", ["src/auth.test.ts"]]]),
      },
      [],
      0.2,
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.staticScore).toBe(1);
  });
  it("forces a full suite for infrastructure changes", () => {
    expect(
      shouldRunFullSuite({
        ...changes,
        files: [{ path: "package.json", status: "modified" }],
      }),
    ).toBe(true);
  });
});
