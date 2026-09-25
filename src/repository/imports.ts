const IMPORT_RE =
  /(?:import\s+(?:[^"']*?\s+from\s+)?|export\s+[^"']*?\s+from\s+|require\s*\(|import\s*\()\s*["']([^"']+)["']/g;

export function extractImports(source: string): string[] {
  return [...source.matchAll(IMPORT_RE)]
    .map((match) => match[1])
    .filter((value): value is string => Boolean(value));
}
