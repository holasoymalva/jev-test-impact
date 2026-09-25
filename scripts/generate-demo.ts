import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(process.cwd(), "fixtures", "generated-demo");
await rm(root, { recursive: true, force: true });
await mkdir(join(root, "src"), { recursive: true });
await writeFile(
  join(root, "package.json"),
  JSON.stringify(
    {
      name: "jti-large-demo",
      private: true,
      devDependencies: { vitest: "^3.2.4" },
    },
    null,
    2,
  ),
);
for (let index = 0; index < 1000; index += 1) {
  const name = `module-${String(index).padStart(4, "0")}`;
  await writeFile(
    join(root, "src", `${name}.ts`),
    `export const value = ${index};\n`,
  );
  await writeFile(
    join(root, "src", `${name}.test.ts`),
    `import { value } from "./${name}"; test("${name}", () => expect(value).toBe(${index}));\n`,
  );
}
console.log(`Generated 1,000 deterministic test files in ${root}`);
