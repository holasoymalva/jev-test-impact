export type TestFramework = "vitest" | "jest";
export type ChangeStatus = "added" | "modified" | "deleted" | "renamed";
export type SelectionReason =
  | "mandatory"
  | "direct"
  | "jev"
  | "fallback"
  | "safety";

export interface ChangedSymbol {
  name: string;
  kind:
    | "function"
    | "class"
    | "method"
    | "variable"
    | "type"
    | "interface"
    | "unknown";
  exported?: boolean;
  path: string;
}

export interface ChangedFile {
  path: string;
  status: ChangeStatus;
  oldPath?: string;
  additions?: number;
  deletions?: number;
  detectedSymbols?: ChangedSymbol[];
}

export interface ChangeSet {
  baseRef: string;
  headRef: string;
  files: ChangedFile[];
  packages: string[];
}

export interface TestDescriptor {
  id: string;
  path: string;
  framework: TestFramework;
  package?: string;
  imports?: string[];
  tags?: string[];
}

export interface Candidate {
  id: string;
  test: TestDescriptor;
  staticScore: number;
  relations: string[];
  mandatory: boolean;
}

export interface TestImpactScore {
  id: string;
  score: number;
}

export interface ImpactDecisionInput {
  changeSet: ChangeSet;
  candidates: Candidate[];
  signal?: AbortSignal;
}

export interface ImpactDecisionEngine {
  scoreTests(input: ImpactDecisionInput): Promise<TestImpactScore[]>;
}

export interface SelectedTest {
  test: TestDescriptor;
  score: number;
  reason: SelectionReason;
  staticScore?: number;
  jevScore?: number;
  relations?: string[];
}

export interface SelectionMetrics {
  testsDiscovered: number;
  candidates: number;
  selected: number;
  skipped: number;
  selectionMs: number;
  jevRequests: number;
}

export interface ImpactSelection {
  changeSet: ChangeSet;
  selected: SelectedTest[];
  skipped: TestDescriptor[];
  metrics: SelectionMetrics;
  fullSuite: boolean;
  fallbackUsed: boolean;
}

export interface TestRunResult {
  exitCode: number;
  durationMs: number;
  command: string;
}
