import { mkdtemp, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runTests } from "../src/runner/executor.js";

describe("path safety", () => {
  it("rejects a selected symlink that escapes the repository", async () => {
    const root = await mkdtemp(join(tmpdir(), "jti-root-"));
    const outside = join(
      await mkdtemp(join(tmpdir(), "jti-outside-")),
      "evil.test.ts",
    );
    await writeFile(outside, "throw new Error('must not execute');\n");
    await symlink(outside, join(root, "escape.test.ts"));
    await expect(
      runTests(root, [
        { id: "1", path: "escape.test.ts", framework: "vitest" },
      ]),
    ).rejects.toThrow("escapes repository");
  });
});
