import { describe, expect, it } from "vitest";
import { extractImports } from "../src/repository/imports.js";
import { resolveImport } from "../src/repository/resolver.js";

describe("import graph helpers", () => {
  it("extracts static, require, and dynamic imports", () => {
    expect(
      extractImports(
        'import { a } from "./a"; const b = require("./b"); import("./c")',
      ),
    ).toEqual(["./a", "./b", "./c"]);
  });
  it("resolves extensions and index modules", () => {
    const known = new Set(["src/a.ts", "src/lib/index.ts", "src/esm.ts"]);
    expect(resolveImport("src/test.ts", "./a", known)).toBe("src/a.ts");
    expect(resolveImport("src/test.ts", "./lib", known)).toBe(
      "src/lib/index.ts",
    );
    expect(resolveImport("src/test.ts", "./esm.js", known)).toBe("src/esm.ts");
  });
});
