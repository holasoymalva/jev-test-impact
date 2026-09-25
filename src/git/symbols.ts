import type { ChangedSymbol } from "../core/types.js";

const DECLARATION =
  /(?:export\s+)?(?:async\s+)?(function|class|const|let|var|interface|type)\s+([A-Za-z_$][\w$]*)/g;

export function detectSymbols(source: string, path: string): ChangedSymbol[] {
  return [...source.matchAll(DECLARATION)].map((match) => ({
    name: match[2] ?? "unknown",
    kind:
      match[1] === "const" || match[1] === "let" || match[1] === "var"
        ? "variable"
        : (match[1] as ChangedSymbol["kind"]),
    exported: match[0].startsWith("export"),
    path,
  }));
}
