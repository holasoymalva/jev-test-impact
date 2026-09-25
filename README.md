# jev-test-impact ⚡

> **Run only the tests that matter.**

<img width="2172" height="724" alt="image" src="https://github.com/user-attachments/assets/39bbd569-ab14-4480-ac95-2169cdddc477" />


`jev-test-impact` uses your Git diff, repository relationships, and **Jev** to select the test files most likely affected by a change.

Instead of running the entire suite:

```text
Git diff
   ↓
Static dependency filtering
   ↓
Jev scores known test candidates
   ↓
Safety rules
   ↓
Run selected Vitest / Jest files
```

```bash
npm install -D jev-test-impact
```

Or using your favorite package manager:

```bash
pnpm add -D jev-test-impact
yarn add -D jev-test-impact
bun add -D jev-test-impact
```

Run impacted tests:

```bash
TYPESAFE_API_KEY=... npx jev-test-impact
```

No API key?

```bash
jti --static
```

uses the local dependency graph without sending anything over the network.

- **npm**: [npmjs.com/package/jev-test-impact](https://www.npmjs.com/package/jev-test-impact)
- **GitHub**: [github.com/holasoymalva/jev-test-impact](https://github.com/holasoymalva/jev-test-impact)

---

## What it looks like

```text
jev-test-impact ⚡

Base: origin/main

Changed files:      3
Tests discovered: 1,000
Candidates:         67
Selected:           18

Jev selection:    241ms

Running Vitest...

✓ 18 test files passed
```

The goal is simple:

> **Spend less time running unrelated tests without blindly trusting an AI model.**

---

## Why Jev?

Test impact is mostly a **decision problem**, not a generation problem.

For every known test candidate, we need to answer:

```text
How likely is this test to be affected by this change?
```

Jev scores those constrained decisions.

It does **not** generate test paths, shell commands, source code, or arbitrary actions.

```text
4,812 tests
     ↓
static narrowing
     ↓
327 candidates
     ↓
Jev
     ↓
43 selected tests
```

This keeps the decision space small, structured, and cheap.

---

## Quick start

### Run impacted tests

```bash
jti
```

### See what would run

```bash
jti select
```

### Run without Jev

```bash
jti select --static
```

### Understand why a test was selected

```bash
jti explain
```

### Compare against the full suite

```bash
jti benchmark --verify
```

### Force the full suite

```bash
jti --full
```

---

## Commands

```bash
jti                         # select and run impacted tests
jti select                  # select without running
jti select --static         # local dependency analysis only
jti select --json           # machine-readable output
jti explain                 # show selection reasons and scores
jti benchmark --verify      # compare reduced vs full suite
jti doctor                  # validate repository setup
jti init                    # create configuration
jti --full                  # bypass selection and run everything
```

---

## Selection modes

`jev-test-impact` is intentionally conservative.

```text
safe        0.40   default
balanced    0.60
aggressive  0.80
```

Higher thresholds select fewer tests.

These values are defaults, **not performance guarantees**. Use your own regression corpus and:

```bash
jti benchmark --verify
```

before using aggressive settings in critical CI.

---

## Configuration

Create:

```text
jev-test-impact.config.ts
```

```ts
import { defineConfig } from "jev-test-impact";

export default defineConfig({
  base: "origin/main",

  mode: "safe",

  selection: {
    threshold: 0.4,
    candidateThreshold: 0.2,
  },

  alwaysRun: [
    "tests/smoke/**",
    "tests/security/**",
  ],

  fallback: "candidates",
});
```

---

## GitHub Action

Use `jev-test-impact` directly in pull requests without installing any CLI package:

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

      - uses: holasoymalva/jev-test-impact@v0.1.3
        with:
          typesafe-api-key: ${{ secrets.TYPESAFE_API_KEY }}
```

> **Note:**
> - `fetch-depth: 0` is required so Git can accurately resolve merge bases and commit diffs.
> - The Action executes the test runner (Vitest or Jest) already installed in your repository.
> - Providing `typesafe-api-key` activates Jev AI impact analysis; if omitted, the Action gracefully falls back to deterministic static graph selection.
> - Do not use `pull_request_target` to execute untrusted pull-request code.

### Action Inputs

| Input | Required | Default | Description |
| --- | --- | --- | --- |
| `typesafe-api-key` | No | none | TypeSafe System One API key used by Jev. |
| `base` | No | automatic | Git base ref used for change detection. |
| `mode` | No | `safe` | Selection mode: `safe`, `balanced`, or `aggressive`. |
| `threshold` | No | mode default | Optional score threshold override. |
| `select-only` | No | `false` | Select tests without running them. |
| `fail-on-api-error` | No | `false` | Fail instead of applying the safe API fallback. |

### Action Outputs

| Output | Description |
| --- | --- |
| `selected-count` | Number of selected test files. |
| `discovered-count` | Number of discovered test files. |
| `candidate-count` | Number of candidate test files. |
| `reduction-percent` | Percentage of discovered tests not selected. |
| `selection-ms` | Selection latency in milliseconds. |
| `selected-tests` | JSON array of selected test paths. |

The Action automatically writes a rich breakdown table directly to `$GITHUB_STEP_SUMMARY`.

---

## Why it is safe

Jev can only score IDs from a candidate set discovered locally.

It cannot generate:

```text
shell commands
arbitrary file paths
JavaScript
test commands
filesystem operations
```

Unknown IDs are discarded.

Every selected test path is resolved inside the repository before execution.

If Jev is unavailable, the default behavior is:

```text
run all static candidates
```

—not zero tests.

Changes to high-impact files such as:

```text
lockfiles
test configuration
workspace configuration
global test setup
```

can automatically fall back to a broader or full test run.

Do not use `pull_request_target` to execute untrusted PR code.

---

## Privacy

By default, Jev receives only compact repository metadata such as:

```text
relative changed paths
changed-file status
candidate test IDs
relationship labels
package relationships
```

`jev-test-impact` does **not** send:

```text
source files
.env values
API keys
credentials
private keys
```

Jev uses:

```text
TYPESAFE_API_KEY
```

Optional:

```text
JEV_BASE_URL
JEV_MODEL
```

---

## Benchmarking

The speedup is only useful if the reduced suite still catches regressions.

Run:

```bash
jti benchmark --verify
```

to compare:

```text
FULL SUITE
STATIC SELECTION
JEV SELECTION
```

The report includes:

```text
test-file reduction
selection latency
test execution time
regressions caught
```

The most important metric is **regression recall**, not raw test reduction.

A passing full suite does not prove 100% regression recall by itself. Use known failing/regression cases before publishing performance claims.

You can generate a deterministic large local demo with:

```bash
pnpm demo:generate
```

---

## How selection works

`jev-test-impact` combines deterministic repository analysis with Jev.

```text
Git diff
   ↓
Changed files / symbols
   ↓
Import + workspace graph
   ↓
Candidate tests
   ↓
Jev impact scores
   ↓
Safety policy
   ↓
Vitest / Jest
```

Static analysis removes obviously unrelated tests first.

Jev only sees the remaining candidates.

That distinction is important:

> **Static analysis narrows the search space. Jev handles semantic uncertainty.**

---

## Supported today

- JavaScript
- TypeScript
- Vitest
- Jest
- pnpm / npm / yarn / Bun
- Git repositories
- pnpm workspaces
- GitHub Actions

Planned after the core algorithm is proven:

- additional JS/TS monorepo tooling
- coverage-assisted selection
- historical test-impact signals
- additional test frameworks

---

## Development

Requires:

```text
Node.js 22+
pnpm
```

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

See [SECURITY.md](SECURITY.md) for the trust boundary and [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

---

## Philosophy

Large language models are great at generating code.

Jev is useful when the problem is choosing between known possibilities.

**LLMs write the code. Jev decides what needs testing.**
