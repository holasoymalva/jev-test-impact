import { extname, posix } from "node:path";

const EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mts",
  ".cts",
  ".mjs",
  ".cjs",
];

export function resolveImport(
  from: string,
  specifier: string,
  known: Set<string>,
): string | undefined {
  if (!specifier.startsWith(".")) return undefined;
  const raw = posix.normalize(posix.join(posix.dirname(from), specifier));
  const extension = extname(raw);
  const stem = extension ? raw.slice(0, -extension.length) : raw;
  const attempts = extension
    ? [
        raw,
        ...([".js", ".jsx", ".mjs", ".cjs"].includes(extension)
          ? [".ts", ".tsx", ".mts", ".cts"].map((ext) => `${stem}${ext}`)
          : []),
      ]
    : [
        raw,
        ...EXTENSIONS.map((ext) => `${raw}${ext}`),
        ...EXTENSIONS.map((ext) => `${raw}/index${ext}`),
      ];
  return attempts.find((path) => known.has(path));
}
