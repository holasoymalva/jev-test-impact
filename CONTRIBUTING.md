# Contributing

Use Node 22 or 24 and pnpm. Keep the product focused on JavaScript/TypeScript test-file impact analysis.

Before opening a pull request, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Network tests must use a fake server or decision engine. Normal CI must not consume paid Jev requests. Benchmark changes should record the repository and commit, base commit, tool version, Jev model, threshold, mode, Node version, and test framework.
