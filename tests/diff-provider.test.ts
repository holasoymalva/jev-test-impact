import { describe, expect, it } from "vitest";
import { parseNameStatus } from "../src/git/diff-provider.js";

describe("parseNameStatus", () => {
  it("parses modifications and renames", () => {
    expect(
      parseNameStatus("M\tsrc/a.ts\nA\tsrc/b.ts\nR100\told.ts\tnew.ts"),
    ).toEqual([
      { path: "src/a.ts", status: "modified" },
      { path: "src/b.ts", status: "added" },
      { path: "new.ts", oldPath: "old.ts", status: "renamed" },
    ]);
  });
});
