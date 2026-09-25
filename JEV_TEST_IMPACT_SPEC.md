# jev-test-impact

> Ultra-fast test impact analysis powered by Jev.
>
> **Run only the tests that matter.**

## 1. Purpose

This document is the source of truth for implementing `jev-test-impact` with Codex.

The project must remain intentionally small and launchable. It is not a generic CI platform, test framework, AI agent, or hosted SaaS.

The product is:

> Given a Git diff and a JavaScript/TypeScript test suite, identify the smallest useful set of test files that should run for that change.

The launch must optimize for:

1. real daily usefulness;
2. a visually obvious Jev advantage;
3. reproducible benchmarks;
4. easy CLI adoption;
5. a reusable GitHub Action;
6. high regression recall;
7. low implementation complexity.

---

## 2. Repository / Product Naming

Repository:

```text
jev-test-impact
```

npm:

```text
jev-test-impact
```

CLI:

```bash
jev-test-impact
```

Short alias:

```bash
jti
```

GitHub description:

```text
Run only the tests that matter. Test impact analysis powered by Jev.
```

Hero tagline:

```text
4,812 tests → 43 tests.
```

Never publish a number like this unless the benchmark actually produces it.

---

## 3. Product Thesis

Most code changes affect a tiny fraction of a repository, but CI often runs the entire test suite.

Example:

```text
Changed:
src/auth/token.ts
src/auth/session.ts

Tests:
4,812
```

Potentially related:

```text
src/auth/token.test.ts
src/auth/session.test.ts
src/api/login.test.ts
src/api/refresh.test.ts
src/e2e/account-recovery.test.ts
```

Most other tests are irrelevant.

Static dependency graphs help, but semantic relationships can exist without direct imports.

Large generative LLMs can reason about impact, but they are slower, more expensive, and unnecessary for what is fundamentally a constrained decision problem:

```text
Should test X run for change Y?

YES / NO
```

or:

```text
Impact score: 0.00–1.00
```

That is the role Jev should play.

---

## 4. Core Demo

The project must be built around a launch-quality terminal demo.

Target format:

```text
jev-test-impact ⚡

Base: origin/main

Changed files:    3
Tests discovered: 4,812
Candidates:       327
Selected:          43

Jev selection: 310ms

Running selected tests...

✓ 43 tests passed

Full suite:      8m 43s
Selected suite:    27s

Regression caught: YES
```

The README should make the value understandable in under 10 seconds.

---

## 5. Primary Use Cases

### Local development

```bash
jti
```

Select and run the tests impacted by current changes.

### Pull requests

```text
PR diff
→ jti
→ relevant test files
→ test runner
```

### Coding agents

After Codex / Claude Code / Cursor modifies code:

```bash
jti
```

instead of:

```bash
pnpm test
```

### Monorepos

A change in package A should not run all tests from unrelated packages.

### Validation / experimentation

```bash
jti benchmark --verify
```

Run selected tests and full suite to measure whether selection is safe.

---

## 6. Non-Goals for v1

Do not build:

- dashboard;
- SaaS backend;
- authentication;
- billing;
- flaky-test detection;
- code review;
- test generation;
- mutation testing;
- vector database;
- generic agent framework;
- Python support;
- Go/Rust/Java support;
- individual-test selection;
- historical ML training.

v1 selects **test files**, not individual tests.

---

## 7. User Experience

Install:

```bash
pnpm add -D jev-test-impact
```

or:

```bash
npm install -D jev-test-impact
```

Run:

```bash
npx jev-test-impact
```

Selection only:

```bash
npx jev-test-impact select
```

Explain:

```bash
npx jev-test-impact explain
```

Benchmark:

```bash
npx jev-test-impact benchmark --verify
```

Machine output:

```bash
npx jev-test-impact select --json
```

---

## 8. High-Level Architecture

```text
Git diff
   ↓
Change Analyzer
   ↓
Test Discovery
   ↓
Static Relationship Index
   ↓
Candidate Generator
   ↓
Jev Impact Selector
   ↓
Safety Policy
   ↓
Selected Test Files
   ↓
Vitest / Jest
   ↓
Result / Benchmark
```

More specifically:

```text
ALL TESTS
   ↓
cheap deterministic filtering
   ↓
CANDIDATES
   ↓
Jev structured decisions
   ↓
SELECTED
```

Example:

```text
4,812 tests
↓
327 deterministic candidates
↓
43 selected by Jev + safety rules
```

Never send all test files to Jev unless the repository is already tiny.

---

## 9. Technology Stack

Core:

```text
TypeScript
Node.js >= 22
pnpm
ESM
```

GitHub Action runtime:

```text
Node.js 24
```

Libraries:

```text
zod
vitest
biome
citty
picocolors
fast-glob
ignore
@actions/core
@actions/github
```

HTTP:

```text
native fetch
```

Build:

```text
tsdown or tsup
```

GitHub Action bundle:

```text
@ncc/cli or equivalent
```

Avoid:

```text
LangChain
agent frameworks
vector DBs
database servers
large AST frameworks
```

unless a later benchmark proves they are needed.

---

## 10. Repository Structure

```text
jev-test-impact/
├── src/
│   ├── cli/
│   │   ├── index.ts
│   │   ├── commands/
│   │   └── output/
│   ├── git/
│   │   ├── diff-provider.ts
│   │   ├── change-analyzer.ts
│   │   └── symbols.ts
│   ├── repository/
│   │   ├── scanner.ts
│   │   ├── imports.ts
│   │   ├── resolver.ts
│   │   └── workspace.ts
│   ├── tests/
│   │   ├── adapter.ts
│   │   ├── discovery.ts
│   │   ├── vitest.ts
│   │   └── jest.ts
│   ├── impact/
│   │   ├── index.ts
│   │   ├── candidates.ts
│   │   ├── static-score.ts
│   │   ├── selector.ts
│   │   └── policy.ts
│   ├── jev/
│   │   ├── client.ts
│   │   ├── engine.ts
│   │   ├── batching.ts
│   │   ├── schemas.ts
│   │   └── errors.ts
│   ├── runner/
│   │   ├── executor.ts
│   │   └── package-manager.ts
│   ├── cache/
│   │   ├── cache.ts
│   │   └── fingerprint.ts
│   ├── benchmark/
│   │   ├── benchmark.ts
│   │   ├── metrics.ts
│   │   └── report.ts
│   ├── config/
│   │   ├── config.ts
│   │   └── schema.ts
│   └── core/
│       ├── types.ts
│       ├── errors.ts
│       └── logger.ts
├── action/
│   ├── index.ts
│   └── summary.ts
├── fixtures/
├── benchmarks/
├── docs/
├── scripts/
├── .github/workflows/
├── action.yml
├── package.json
├── tsconfig.json
├── biome.json
├── README.md
├── SPEC.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE
```

---

## 11. Core Domain Types

```ts
export interface ChangeSet {
  baseRef: string;
  headRef: string;
  files: ChangedFile[];
  packages: string[];
}

export interface ChangedFile {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed";
  oldPath?: string;
  additions?: number;
  deletions?: number;
  detectedSymbols?: ChangedSymbol[];
}

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

export interface TestDescriptor {
  id: string;
  path: string;
  framework: "vitest" | "jest";
  package?: string;
  suiteNames?: string[];
  testNames?: string[];
  imports?: string[];
  tags?: string[];
}

export interface SelectedTest {
  test: TestDescriptor;
  score: number;
  reason: "mandatory" | "direct" | "jev" | "fallback";
  staticScore?: number;
  jevScore?: number;
}

export interface ImpactSelection {
  selected: SelectedTest[];
  skipped: TestDescriptor[];
  metrics: SelectionMetrics;
}

export interface SelectionMetrics {
  testsDiscovered: number;
  candidates: number;
  selected: number;
  skipped: number;
  selectionMs: number;
  jevRequests: number;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostUsd?: number;
}
```

---

## 12. Git Diff Provider

Interface:

```ts
export interface DiffProvider {
  getChangeSet(options: DiffOptions): Promise<ChangeSet>;
}
```

Default:

```text
GitDiffProvider
```

Use subprocess args, never interpolated shell commands.

Preferred:

```ts
spawn("git", args, { shell: false })
```

Useful Git commands:

```bash
git merge-base
git diff --name-status
git diff --unified=3
```

Default base resolution:

```text
explicit --base
↓
merge-base with origin/main
↓
merge-base with main
↓
HEAD~1
```

---

## 13. Repository Scanning

Supported v1:

```text
JavaScript
TypeScript
```

Extensions:

```text
.js
.jsx
.ts
.tsx
.mjs
.cjs
.mts
.cts
```

Default ignores:

```text
.git/**
node_modules/**
dist/**
build/**
coverage/**
.next/**
.cache/**
tmp/**
vendor/**
generated/**
```

Also respect:

```text
.gitignore
.jev-test-impact-ignore
```

---

## 14. Test Discovery

Supported:

```text
Vitest
Jest
```

Patterns:

```text
**/*.test.ts
**/*.test.tsx
**/*.test.js
**/*.test.jsx
**/*.spec.ts
**/*.spec.tsx
**/*.spec.js
**/*.spec.jsx
**/__tests__/**
```

Framework detection signals:

```text
package.json dependencies
package.json scripts
vitest.config.*
jest.config.*
```

---

## 15. Test Runner Adapter

```ts
export interface TestRunnerAdapter {
  readonly framework: "vitest" | "jest";

  detect(root: string): Promise<boolean>;

  discover(root: string): Promise<TestDescriptor[]>;

  buildCommand(
    selected: TestDescriptor[],
    config: RunnerConfig
  ): TestCommand;

  execute(
    selected: TestDescriptor[],
    config: RunnerConfig
  ): Promise<TestRunResult>;
}
```

Vitest conceptually:

```bash
vitest run file1 file2
```

Jest:

```bash
jest --runTestsByPath file1 file2
```

Verify actual invocation against installed framework versions.

---

## 16. Package Manager Detection

```text
pnpm-lock.yaml  → pnpm
yarn.lock       → yarn
package-lock    → npm
bun.lock*       → bun
```

Use local project binaries.

---

## 17. Import Graph

Build a lightweight JS/TS graph.

Detect:

```ts
import x from "./foo";
import { x } from "./foo";
require("./foo");
import("./foo");
```

Resolve:

```text
relative imports
extension inference
index files
simple tsconfig paths
workspace package imports
```

Do not implement full bundler resolution.

Graph:

```ts
export interface ImpactIndex {
  importsByFile: Map<string, string[]>;
  importersByFile: Map<string, string[]>;
  testsBySourceFile: Map<string, string[]>;
  packageByFile: Map<string, string>;
  siblingTests: Map<string, string[]>;
}
```

---

## 18. Static Candidate Generator

Every test receives a deterministic candidate score.

Suggested signals:

```text
sibling test               +1.00
direct import              +0.95
transitive dependency      +0.75
same workspace package     +0.40
same directory/domain      +0.30
changed symbol overlap     +0.20
```

These are **candidate weights**, not impact probabilities.

They should be configurable and tuned through benchmarks.

---

## 19. Mandatory Tests

Some tests always run.

Examples:

```text
direct sibling tests
explicit user mappings
smoke tests
security tests
```

Config:

```ts
alwaysRun: [
  "tests/smoke/**",
  "tests/security/**",
]
```

Mandatory tests bypass Jev filtering.

---

## 20. Full-Suite Safety Triggers

Default conservative behavior for changes to:

```text
package.json
lockfiles
tsconfig
vitest config
jest config
global test setup
test environment
```

Recommended result:

```text
full suite
```

or package-wide suite in a monorepo.

This can be tuned later.

---

## 21. Jev's Role

Jev is not used to:

- generate tests;
- write code;
- summarize arbitrary source;
- generate shell commands.

Jev only decides:

```text
How likely is each known candidate test file
to validate the current change?
```

This must be one of the most visible architectural properties of the project.

---

## 22. Decision Engine Interface

```ts
export interface ImpactDecisionEngine {
  scoreTests(
    input: ImpactDecisionInput
  ): Promise<TestImpactScore[]>;
}
```

Implement:

```text
JevDecisionEngine
```

Internal testing implementation:

```text
FakeDecisionEngine
```

Fallback:

```text
RulesDecisionEngine
```

---

## 23. Jev API Client

Current Jev integration should use TypeSafe's System One API.

Conceptual endpoint:

```text
POST /v1/systemone
```

Auth:

```text
Authorization: Bearer <TYPESAFE_API_KEY>
```

Keep transport isolated:

```text
src/jev/client.ts
```

Config:

```bash
TYPESAFE_API_KEY=
JEV_MODEL=
JEV_BASE_URL=
```

Never hardcode a model forever.

---

## 24. Jev Input

Do not send full source files in v1.

Send metadata.

Shared change context:

```text
Changed files:
- src/auth/token.ts
- src/auth/session.ts

Changed symbols:
- validateToken
- createSession
```

Candidate table:

```text
[001] src/auth/token.test.ts
      relation: direct-import
      package: auth

[002] src/api/login.test.ts
      relation: transitive
      package: api

[003] src/e2e/recovery.test.ts
      relation: same-domain
      package: e2e
```

Question:

```text
How likely is each test file to be impacted by this change?
```

Preferred output:

```text
candidate ID
impact score
```

No essay.

---

## 25. Dynamic Indexed Test Space

Represent candidate tests by IDs.

Jev can only select/score IDs it was given.

Example:

```text
[1] auth/token.test.ts
[2] auth/session.test.ts
[3] api/login.test.ts
```

The executor never trusts arbitrary remote paths.

This provides a critical security property:

> Model output can select from known tests, but cannot invent commands or filesystem paths.

---

## 26. Batching / Fan-Out

Do not create one HTTP request per test.

Batch approximately:

```text
25–100 candidate decisions per request
```

depending on API limits and benchmark results.

Where the API allows multiple questions in a single System One request:

```text
one shared context
+
many candidate questions
=
one network round trip
```

This is part of the project's performance thesis.

---

## 27. Candidate Compression

Avoid repeating the Git diff or change metadata for every candidate.

Send:

```text
shared change context
+
candidate table
```

This should reduce payload size significantly.

---

## 28. Selection Policy

Pseudo:

```ts
for (const candidate of candidates) {
  if (candidate.mandatory) {
    select(candidate);
    continue;
  }

  if (candidate.jevScore >= threshold) {
    select(candidate);
  }
}
```

Then run safety expansion rules.

---

## 29. Selection Modes

Expose:

```text
safe
balanced
aggressive
```

Initial thresholds (must be benchmark tuned):

```text
safe       0.40
balanced   0.60
aggressive 0.80
```

First public default:

```text
safe
```

Only change default after benchmark evidence.

---

## 30. Failure / Fallback Behavior

If Jev API fails:

Default:

```text
run all static candidates
```

Do NOT:

```text
run zero tests
```

Config:

```text
fallback = candidates | full-suite | error
```

Recommended:

```text
candidates
```

---

## 31. Static Mode

```bash
jti --static
```

No Jev.

Useful for:

- CI fallback;
- benchmarking;
- users without a key;
- testing algorithm value.

The launch benchmark must compare:

```text
full suite
static candidates
static + Jev
```

If Jev adds no measurable value, improve the design before launch.

---

## 32. CLI

Commands:

```text
jti run
jti select
jti explain
jti benchmark
jti doctor
jti init
```

Default:

```bash
jti
```

equals:

```bash
jti run
```

---

## 33. CLI Output

Example:

```text
jev-test-impact ⚡

Diff
  base        origin/main
  files       3

Tests
  discovered  428
  candidates   61
  selected     14

Jev
  calls         2
  selection   227ms

Running Vitest...

✓ 14 tests passed in 11.2s
```

Keep it compact.

---

## 34. Explain Mode

```bash
jti explain
```

Example:

```text
src/auth/token.test.ts
  static: direct import
  Jev:   0.98
  selected: yes

src/api/login.test.ts
  static: transitive dependency
  Jev:   0.82
  selected: yes

src/billing/invoice.test.ts
  static: weak package relation
  Jev:   0.07
  selected: no
```

No generative LLM required.

---

## 35. JSON Mode

```bash
jti select --json
```

Example:

```json
{
  "base": "origin/main",
  "changedFiles": 3,
  "testsDiscovered": 428,
  "candidates": 61,
  "selected": [
    {
      "path": "src/auth/token.test.ts",
      "score": 0.98,
      "reason": "jev"
    }
  ]
}
```

---

## 36. Configuration

File:

```text
jev-test-impact.config.ts
```

Example:

```ts
import { defineConfig } from "jev-test-impact";

export default defineConfig({
  base: "origin/main",

  mode: "safe",

  selection: {
    threshold: 0.6,
    candidateThreshold: 0.2,
  },

  alwaysRun: [
    "tests/smoke/**",
  ],

  fallback: "candidates",
});
```

---

## 37. GitHub Action

The repository must ship a reusable JavaScript/TypeScript GitHub Action.

Usage:

```yaml
name: Test Impact

on:
  pull_request:

jobs:
  test-impact:
    runs-on: ubuntu-latest

    permissions:
      contents: read

    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - uses: pnpm/action-setup@v4

      - run: pnpm install --frozen-lockfile

      - uses: <owner>/jev-test-impact@v1
        with:
          typesafe-api-key: ${{ secrets.TYPESAFE_API_KEY }}
```

Use:

```yaml
runs:
  using: node24
```

in `action.yml`.

---

## 38. GitHub Action Inputs

```yaml
typesafe-api-key:
base:
mode:
threshold:
select-only:
fail-on-api-error:
```

Recommended defaults:

```text
mode = safe
select-only = false
fail-on-api-error = false
```

---

## 39. GitHub Action Outputs

```text
selected-count
discovered-count
candidate-count
reduction-percent
selection-ms
selected-tests
```

---

## 40. GitHub Job Summary

Write:

```text
$GITHUB_STEP_SUMMARY
```

Example:

```markdown
## jev-test-impact ⚡

| Metric | Value |
| --- | ---: |
| Tests discovered | 4,812 |
| Candidates | 327 |
| Tests selected | 43 |
| Reduction | 99.1% |
| Selection time | 310ms |

### Selected files
...
```

Do not add PR comments in v1.

---

## 41. GitHub Security

Do not recommend `pull_request_target` for running untrusted PR code.

Minimal permission:

```yaml
permissions:
  contents: read
```

The action does not need write access.

---

## 42. Security Invariants

Jev output must never become:

- shell commands;
- JavaScript;
- arbitrary paths;
- selectors;
- environment values.

It only becomes:

```text
IDs from a known candidate test set
```

Validation:

```ts
for (const remote of result) {
  if (!knownCandidateIds.has(remote.id)) {
    reject(remote);
  }
}
```

---

## 43. Privacy

v1 should send only repository metadata:

```text
changed relative paths
changed symbol names
test relative paths
test imports
package names
relationship labels
```

Do NOT send:

```text
.env values
API keys
credentials
private keys
full repository contents
full source files
```

This is both a security and marketing benefit.

---

## 44. Prompt Injection Resistance

Repository metadata is untrusted.

No remote output receives execution privileges.

The model has no tools.

It returns only validated structured decisions.

---

## 45. API Reliability

Jev requests:

```text
timeout
max 2 network retries
Retry-After support
exponential backoff
```

No recursive retry framework.

When unavailable:

```text
safe fallback
```

---

## 46. Test Execution

Use:

```ts
spawn(binary, args, {
  shell: false,
});
```

Do not construct arbitrary shell strings.

Support:

```text
Vitest
Jest
```

Use selected test **files**.

---

## 47. Full-Suite Escape Hatch

```bash
jti --full
```

Always available.

---

## 48. Doctor

```bash
jti doctor
```

Checks:

```text
Git repository
base ref
package manager
Vitest/Jest
test discovery
TYPESAFE_API_KEY
Jev connectivity
```

Example:

```text
✓ Git repository
✓ origin/main
✓ Vitest
✓ 428 test files
✓ pnpm
✓ TYPESAFE_API_KEY
✓ Jev reachable

Ready.
```

---

## 49. Cache

Cache:

```text
import graph
test discovery
file hashes
selection results
```

Do not cache API credentials or full source.

Key import graph by:

```text
commit SHA + tool version
```

Key selection by:

```text
diff hash + candidate hash + model + threshold
```

---

## 50. Monorepo Support

Detect initially:

```text
pnpm-workspace.yaml
package.json workspaces
turbo.json
```

Priority:

```text
pnpm workspaces
```

Model:

```ts
export interface WorkspaceGraph {
  packages: WorkspacePackage[];
  dependencies: PackageEdge[];
}
```

If package `core` changes, tests in direct dependent packages are candidates.

---

## 51. Special Changes

Conservative triggers include:

```text
lockfile changes
test config changes
global test setup
tsconfig changes
workspace config changes
```

Default to wider or full selection.

---

## 52. Benchmarking

This is a product feature, not internal tooling.

Command:

```bash
jti benchmark --verify
```

Flow:

```text
select tests
↓
run selected suite
↓
run full suite
↓
compare
```

---

## 53. Benchmark Metrics

Primary:

```text
regression recall
test reduction %
test execution time reduction %
selection latency
```

Secondary:

```text
candidate reduction
Jev request count
token usage
cost
```

---

## 54. Regression Recall

The most important metric.

Question:

```text
Did the selected suite catch every regression
that the full suite caught?
```

Never market test reduction without recall.

---

## 55. Benchmark Report

Example:

```text
jev-test-impact benchmark

Cases:                100
Known regressions:    100
Full-suite caught:    100
JTI caught:            99

Regression recall:   99.0%

Average tests reduced:
93.4%

Median selection:
284ms

Median test-time reduction:
81.7%
```

---

## 56. Benchmark Baselines

Compare:

```text
FULL
STATIC
JEV
```

This proves whether Jev actually improves the product.

A project named `jev-test-impact` must show Jev contributes meaningfully.

---

## 57. Benchmark Fixtures

Create:

```text
fixtures/simple-vitest
fixtures/jest-app
fixtures/monorepo
fixtures/regression-suite
```

Include:

- direct dependencies;
- transitive dependencies;
- unrelated tests;
- cross-package relationships;
- e2e-style semantic relationships.

---

## 58. Large Demo Fixture

Do not commit thousands of huge files.

Provide:

```bash
pnpm demo:generate
```

which creates a deterministic large fixture with thousands of test files/cases.

This supports the launch demo.

---

## 59. Real-World Benchmark

Before major promotion, add 1–3 real open-source repositories if practical.

Methodology must be documented.

Do not cherry-pick only successful examples.

---

## 60. Honest Benchmarking

Store:

```text
repository commit
base commit
tool version
Jev model
threshold
mode
Node version
test framework
```

Clearly state that results may vary.

---

## 61. Testing the Project

Unit tests:

```text
diff parsing
test discovery
import graph
candidate scoring
safety policy
config
Jev schema validation
fallback
```

Integration:

```text
fixture Git repos
fake Jev server
Vitest execution
Jest execution
```

End-to-end:

```text
CLI against fixture
```

Normal CI must not use paid Jev calls.

---

## 62. Fake Jev

Create:

```ts
createFakeDecisionEngine({
  scores: {
    "src/auth/token.test.ts": 0.98,
    "src/billing/invoice.test.ts": 0.02,
  },
});
```

This makes the full selection pipeline deterministic in CI.

---

## 63. Live Jev Tests

Optional:

```text
workflow_dispatch
```

using repository secret:

```text
TYPESAFE_API_KEY
```

Never required for pull requests.

---

## 64. Important Invariants

Test with property/invariant tests:

```text
selected ⊆ discovered

mandatory tests always selected

unknown Jev IDs never execute

Jev failure cannot silently produce zero tests

full-suite trigger overrides Jev

paths cannot escape repository root
```

---

## 65. Path Safety

Use `realpath`.

Every selected path must be within repository root.

Reject symlink escapes.

---

## 66. Performance Targets

Static repository processing target:

```text
small repo: <500ms
medium repo: <2s
```

excluding API/test execution.

Jev selection should target sub-second performance, but do not promise it until measured.

---

## 67. Core Algorithm

```ts
async function selectImpactedTests(input) {
  const changeSet =
    await diffProvider.getChangeSet(input);

  const allTests =
    await testAdapter.discover(input.root);

  if (shouldRunFullSuite(changeSet, input.config)) {
    return selectAll(allTests, "safety");
  }

  const index =
    await repositoryIndex.loadOrBuild(input.root);

  const candidates =
    generateCandidates({
      changeSet,
      tests: allTests,
      index,
    });

  const mandatory =
    candidates.filter(isMandatory);

  const semantic =
    candidates.filter(x => !isMandatory(x));

  let scores;

  try {
    scores =
      await decisionEngine.scoreTests({
        changeSet,
        candidates: semantic,
      });
  } catch (error) {
    return applyFallback(
      candidates,
      mandatory,
      input.config
    );
  }

  const selected =
    applySelectionPolicy(
      mandatory,
      scores,
      input.config
    );

  return validateSelection(
    selected,
    allTests
  );
}
```

---

## 68. Public API

Keep small:

```ts
export {
  selectImpactedTests,
  runImpactedTests,
  defineConfig,
};

export type {
  ChangeSet,
  TestDescriptor,
  ImpactSelection,
  SelectionMetrics,
};
```

Example:

```ts
import {
  selectImpactedTests,
} from "jev-test-impact";

const result = await selectImpactedTests({
  root: process.cwd(),
  base: "origin/main",
});
```

---

## 69. TypeScript Quality

Use:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "noImplicitOverride": true
}
```

Avoid `any`.

---

## 70. Error Model

```ts
export class JevTestImpactError extends Error {}
export class GitError extends JevTestImpactError {}
export class TestDiscoveryError extends JevTestImpactError {}
export class JevApiError extends JevTestImpactError {}
export class ConfigError extends JevTestImpactError {}
export class RunnerError extends JevTestImpactError {}
```

CLI errors should be actionable.

---

## 71. Abort / Cancellation

Propagate `AbortSignal` to:

```text
Git subprocesses
Jev requests
test runner
```

Ctrl-C should terminate cleanly.

---

## 72. Logging

Default:

```text
concise
```

Options:

```text
--verbose
--debug
--json
```

Never log credentials.

---

## 73. CI for This Repository

Required jobs:

```text
lint
typecheck
unit tests
integration tests
build
action bundle verification
```

Test Node:

```text
22
24
```

---

## 74. Distribution

npm:

```text
jev-test-impact
```

GitHub Action:

```text
<owner>/jev-test-impact@v1
```

Action bundle committed under:

```text
dist/
```

CI must verify `dist` is current.

---

## 75. README Strategy

First viewport:

```text
banner
title
one-sentence explanation
benchmark
GIF
one-command install
```

Do not begin with architecture.

Recommended hero:

```markdown
# jev-test-impact ⚡

> Run only the tests that matter.

**4,812 tests → 43 tests.**
Jev selects the test files most likely to be affected by your Git diff.

[GIF]

```bash
npx jev-test-impact
```
```

---

## 76. README Comparison

Possible:

| Method | Fast | Semantic | Low-cost | Safe known set |
|---|---:|---:|---:|---:|
| Full suite | ❌ | N/A | ❌ | ✅ |
| Import graph | ✅ | ❌ | ✅ | ✅ |
| Large LLM | ❌ | ✅ | ❌ | depends |
| **jev-test-impact** | ✅ | ✅ | ✅ | ✅ |

Avoid quantitative claims that are not benchmarked.

---

## 77. README Safety Statement

Include prominently:

```text
Jev never generates shell commands or arbitrary test paths.

It only scores/selects tests from a candidate set discovered locally.
```

---

## 78. README Benchmark Section

Must include:

```text
tests discovered
tests selected
test reduction
regression recall
selection latency
full-suite time
selected-suite time
```

Never show only speed.

---

## 79. Launch GIF

Terminal recording under ~15 seconds:

```text
change detected
→ 4,812 tests
→ 43 selected
→ tests pass
→ reduction shown
```

Real output only.

---

## 80. GitHub Topics

Recommended:

```text
jev
typesafe
test-impact-analysis
testing
developer-tools
ci
github-actions
typescript
vitest
jest
ai
ai-agents
```

---

## 81. Launch Hooks

GitHub README:

```text
4,812 tests → 43 tests.
```

X/LinkedIn:

```text
Your coding agent is fast. Your test suite isn't.
```

Hacker News:

```text
Show HN: Jev Test Impact – run only the tests affected by your Git diff
```

Reddit:

```text
I built a Jev-powered test selector so coding agents don't need to run the entire suite after every edit
```

---

## 82. Implementation Phases

### Phase 0 — Foundation

Create:

```text
TypeScript
pnpm
Vitest
Biome
build
GitHub CI
```

No Jev.

### Phase 1 — Git Diff

Implement:

```text
DiffProvider
ChangeSet
ChangedFile
base resolution
```

### Phase 2 — Test Discovery

Implement:

```text
Vitest
Jest
```

### Phase 3 — Import Graph

Implement lightweight JS/TS dependencies.

### Phase 4 — Static Candidates

Implement scores, mandatory tests, package relationships.

At this milestone:

```bash
jti select --static
```

must work.

### Phase 5 — Jev Client

Implement:

```text
auth
System One requests
schema validation
timeouts
batching
mock tests
```

### Phase 6 — Jev Selector

Build:

```text
indexed candidates
shared change context
scores
thresholds
```

### Phase 7 — Test Execution

Connect Vitest/Jest.

Now:

```bash
jti
```

works end-to-end.

### Phase 8 — Safety / Fallback

Implement:

```text
safe mode
full-suite triggers
static fallback
path validation
```

### Phase 9 — Benchmark

Implement:

```text
selected vs full
regression recall
time comparison
report
```

### Phase 10 — GitHub Action

Implement:

```text
action.yml
Node 24
inputs
outputs
job summary
```

### Phase 11 — Launch

Create:

```text
README
GIF
benchmark
SECURITY
LICENSE
npm release
GitHub release
```

---

## 83. Exact Initial Codex Tasks

Execute in this order.

### Task 1

Create repository foundation.

Acceptance:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

all pass.

### Task 2

Implement Git diff provider with tests using temporary repositories.

### Task 3

Implement Vitest/Jest file discovery.

### Task 4

Implement lightweight import graph.

### Task 5

Implement deterministic candidate scoring.

### Task 6

Implement `jti select --static`.

This is the first non-AI end-to-end milestone.

### Task 7

Implement Jev client behind `ImpactDecisionEngine`.

Mock all network tests.

### Task 8

Implement batching and indexed candidate scoring.

### Task 9

Integrate Jev with CLI.

### Task 10

Implement selected test execution.

### Task 11

Implement safety modes and API fallback.

### Task 12

Implement benchmark and `--verify`.

### Task 13

Implement GitHub Action.

### Task 14

Create launch fixture, benchmark, README, GIF instructions and docs.

Do not add new features before these are complete.

---

## 84. Codex Constraints

Codex must NOT:

- create a web app;
- add a database;
- add auth;
- build agent orchestration;
- add other languages;
- implement test generation;
- add a vector DB;
- add generic plugin systems;
- add historical ML;
- add individual test-case selection;
- use an LLM for code summaries in v1.

When ambiguous:

```text
choose the simpler implementation
```

---

## 85. Definition of Done for v0.1

```text
[ ] npm package works
[ ] zero-config Vitest works
[ ] zero-config Jest works
[ ] Git diff works
[ ] import graph works
[ ] static candidates work
[ ] Jev selection works
[ ] Jev batching works
[ ] selected tests execute
[ ] safe mode works
[ ] API fallback works
[ ] JSON output works
[ ] explain works
[ ] benchmark works
[ ] regression recall is reported
[ ] GitHub Action works in another repo
[ ] Node 24 action
[ ] job summary works
[ ] secrets never logged
[ ] arbitrary remote test paths cannot execute
[ ] normal CI has no paid API dependency
[ ] README has real demo
[ ] benchmark is reproducible
[ ] SECURITY.md
[ ] LICENSE
```

---

## 86. Launch Gate

Do NOT launch because the code is complete.

Launch when:

```text
A developer can install it in a real JS/TS repository
and use it on a pull request without reading the source.
```

Also require:

```text
static vs Jev benchmark
```

to prove Jev provides actual value.

---

## 87. Most Important Metrics

Priority order:

```text
1. regression recall
2. test reduction
3. test execution time saved
4. selection latency
5. cost
```

Do not sacrifice #1 for #2.

---

## 88. Product North Star

Developers should eventually trust:

```bash
jti
```

as the fast-feedback equivalent of:

```bash
pnpm test
```

for local iteration and AI coding loops.

---

## 89. Technical North Star

The architecture should remain:

```text
deterministic narrowing
+
Jev structured selection
+
strict validation
+
existing test runner
```

No generative model should be necessary.

---

## 90. Final Implementation Instruction

Use this document as the source of truth.

Build the smallest complete product that achieves:

```text
Git diff
→ candidate test files
→ Jev scores/selects
→ safety policy
→ tests run
→ benchmark proves value
```

Priority:

```text
end-to-end usefulness
>
regression safety
>
benchmark credibility
>
developer experience
>
architecture elegance
```

If a feature does not improve the launch demo, real daily usage, benchmark quality, or safety, postpone it.

The launch should make this command genuinely useful:

```bash
npx jev-test-impact
```

and make the README instantly communicate:

```text
Thousands of tests.
One code change.
Jev decides which tests actually matter.
```
