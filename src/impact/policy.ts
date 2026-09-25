import type { ChangeSet } from "../core/types.js";

const FULL_SUITE = [
  /(^|\/)package\.json$/,
  /(?:pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lockb?)$/,
  /(^|\/)tsconfig(?:\.[^/]+)?\.json$/,
  /(^|\/)(?:vitest|jest)\.config\./,
  /(^|\/)pnpm-workspace\.yaml$/,
  /(?:global-setup|setupTests|test-setup)/i,
];

export function shouldRunFullSuite(changeSet: ChangeSet): boolean {
  return changeSet.files.some((file) =>
    FULL_SUITE.some((pattern) => pattern.test(file.path)),
  );
}
