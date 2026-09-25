import { execFile } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { configSchema } from "../src/config/schema.js";
import { selectImpactedTestsInternal } from "../src/impact/index.js";

const exec = promisify(execFile);

describe("selection pipeline", () => {
  it("selects a test impacted by a working-tree change", async () => {
    const root = await mkdtemp(join(tmpdir(), "jti-"));
    await mkdir(join(root, "src"));
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({ devDependencies: { vitest: "latest" } }),
    );
    await writeFile(join(root, "src/value.ts"), "export const value = 1;\n");
    await writeFile(
      join(root, "src/value.test.ts"),
      'import { value } from "./value"; test("value", () => expect(value).toBe(1));\n',
    );
    await exec("git", ["init", "-b", "main"], { cwd: root });
    await exec("git", ["config", "user.email", "test@example.com"], {
      cwd: root,
    });
    await exec("git", ["config", "user.name", "Test"], { cwd: root });
    await exec("git", ["add", "."], { cwd: root });
    await exec("git", ["commit", "-m", "initial"], { cwd: root });
    await writeFile(join(root, "src/value.ts"), "export const value = 2;\n");
    const result = await selectImpactedTestsInternal({
      root,
      base: "HEAD",
      static: true,
      config: configSchema.parse({}),
    });
    expect(result.selected.map((item) => item.test.path)).toEqual([
      "src/value.test.ts",
    ]);
  });
});
