# jev-test-impact ⚡

> Run only the tests that matter.

`jev-test-impact` finds the smallest useful set of Vitest or Jest files for a Git diff. It narrows the repository deterministically, asks Jev to score only known candidates, applies conservative safety rules, and runs your existing test runner.

```bash
pnpm add -D jev-test-impact
TYPESAFE_API_KEY=... npx jev-test-impact
```

No API key? `jti --static` uses the local import graph and is also the automatic zero-config mode when a key is absent.

## Why it is safe

Jev never generates shell commands or arbitrary test paths. It can only return IDs from a candidate set discovered locally; unknown IDs are discarded, every selected path is resolved inside the repository, and API failures default to all static candidates—not zero tests. Dependency, lockfile, test configuration, workspace, and global setup changes run the full suite.

## Commands

```bash
jti                         # select and run impacted tests
jti select --static         # selection only, no network
jti select --json           # machine-readable output
jti explain                 # reasons and scores
jti benchmark --verify      # compare selected and full suites
jti doctor                  # validate the repository
jti init                    # create a config file
jti --full                  # explicit full-suite escape hatch
```

Modes use initial conservative thresholds: `safe` (0.40, default), `balanced` (0.60), and `aggressive` (0.80). These are not benchmark claims; tune them against your own regression corpus.

## Configuration

```ts
import { defineConfig } from "jev-test-impact";

export default defineConfig({
  base: "origin/main",
  mode: "safe",
  selection: { threshold: 0.4, candidateThreshold: 0.2 },
  alwaysRun: ["tests/smoke/**", "tests/security/**"],
  fallback: "candidates",
});
```

Jev uses `TYPESAFE_API_KEY`, with optional `JEV_BASE_URL` and `JEV_MODEL`. Only relative paths, changed-file status, relationship labels, and candidate IDs are sent—never source files or environment values.

## GitHub Action

```yaml
name: Test Impact
on: pull_request
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
      - uses: your-org/jev-test-impact@v1
        with:
          typesafe-api-key: ${{ secrets.TYPESAFE_API_KEY }}
```

The action uses Node 24 and writes counts, reduction, latency, selected paths, and a job summary. Do not use `pull_request_target` to execute untrusted PR code.

## Honest benchmarking

`jti benchmark --verify` compares the Jev selection, the static baseline, and the full suite. It reports file reduction, timings, and whether regressions caught by the full suite were also caught by each reduced suite. A passing full suite is reported as 100% for that run but does not establish real regression recall; use known-regression cases before publishing performance claims.

Generate a deterministic 1,000-file local demo with `pnpm demo:generate`. No synthetic performance number is presented here as a measured real-world result.

## Development

Requires Node 22+ and pnpm.

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

See [SECURITY.md](SECURITY.md) for the trust boundary and [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.
