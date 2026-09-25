# Security

Report vulnerabilities privately through the repository's security advisory feature. Do not open a public issue containing credentials or an exploit.

## Trust boundary

- Repository filenames and import metadata are untrusted.
- Jev receives metadata, not source code, secrets, or environment values.
- Remote results are validated scores keyed by IDs from the current candidate batch.
- Remote output never becomes code, a command, an environment value, or an arbitrary path.
- Test processes use argument arrays with `shell: false`.
- Selected paths are canonicalized and must remain inside the repository root; symlink escapes are rejected.
- API errors select static candidates by default. They never silently select zero tests.

The GitHub Action requires only `contents: read`. Avoid `pull_request_target` when executing code from pull requests.
