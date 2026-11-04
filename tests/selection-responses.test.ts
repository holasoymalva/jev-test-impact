import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { expect, it } from "vitest";
import { configSchema } from "../src/config/schema.js";
import type { ImpactDecisionInput } from "../src/core/types.js";
import { selectImpactedTestsInternal } from "../src/impact/index.js";

const exec = promisify(execFile);

it("retains candidates for incomplete responses and honors the fallback policy", async () => {
  const root = await mkdtemp(join(tmpdir(), "jti-responses-"));
  try {
    await mkdir(join(root, "src"));
    await mkdir(join(root, "tests"));
    await writeFile(
      join(root, "package.json"),
      '{"devDependencies":{"vitest":"3.2.4"}}',
    );
    await writeFile(join(root, "src/leaf.ts"), "export const value = 1;\n");
    await writeFile(
      join(root, "src/mid.ts"),
      'import { value } from "./leaf"; export const doubled = value * 2;\n',
    );
    for (const name of ["a", "b"]) {
      await writeFile(
        join(root, `tests/${name}.test.ts`),
        'import { doubled } from "../src/mid";\n',
      );
    }
    await exec("git", ["init", "-q"], { cwd: root });
    await exec("git", ["add", "."], { cwd: root });
    await exec(
      "git",
      [
        "-c",
        "user.name=Test",
        "-c",
        "user.email=test@example.invalid",
        "commit",
        "--no-gpg-sign",
        "-qm",
        "initial",
      ],
      { cwd: root },
    );
    await writeFile(join(root, "src/leaf.ts"), "export const value = 2;\n");
    for (const response of [
      "empty",
      "partial",
      "duplicate",
      "unknown",
      "nonfinite",
      "below-zero",
      "above-one",
    ] as const) {
      const options = {
        root,
        base: "HEAD",
        config: configSchema.parse({ fallback: "candidates" }),
        engine: {
          async scoreTests({ candidates }: ImpactDecisionInput) {
            const [first, second] = candidates;
            expect(candidates).toHaveLength(2);
            if (!first || !second)
              throw new Error("Expected two semantic candidates");
            const firstScore = { id: first.id, score: 0 };
            const secondScore = { id: second.id, score: 0 };
            const scores = [firstScore, secondScore];
            if (response === "empty") return [];
            if (response === "partial") return scores.slice(0, 1);
            if (response === "duplicate") return [firstScore, firstScore];
            if (response === "unknown")
              return [{ ...firstScore, id: "unknown" }, secondScore];
            if (response === "below-zero")
              return [{ ...firstScore, score: -0.1 }, secondScore];
            if (response === "above-one")
              return [{ ...firstScore, score: 1.1 }, secondScore];
            return [{ ...firstScore, score: Number.NaN }, secondScore];
          },
        },
      };
      const selected = await selectImpactedTestsInternal(options);
      expect(selected.fallbackUsed).toBe(true);
      expect(selected.skipped).toEqual([]);
      expect(selected.selected.map((item) => item.test.path).sort()).toEqual([
        "tests/a.test.ts",
        "tests/b.test.ts",
      ]);
      const full = await selectImpactedTestsInternal({
        ...options,
        config: configSchema.parse({ fallback: "full-suite" }),
      });
      expect(full.fullSuite).toBe(true);
      await expect(
        selectImpactedTestsInternal({
          ...options,
          config: configSchema.parse({ fallback: "error" }),
        }),
      ).rejects.toThrow("one finite score per candidate");
    }
    const negative = await selectImpactedTestsInternal({
      root,
      base: "HEAD",
      config: configSchema.parse({}),
      engine: {
        async scoreTests({ candidates }) {
          return candidates.map((candidate) => ({
            id: candidate.id,
            score: 0,
          }));
        },
      },
    });
    expect(negative.fallbackUsed).toBe(false);
    expect(negative.selected).toEqual([]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
