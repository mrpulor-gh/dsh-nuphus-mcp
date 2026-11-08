# Contributing

`dsh-nuphus-mcp` is a thin Cordis wrapper around
[nuphus-mcp](https://github.com/mrpulor-gh/nuphus-mcp) — it contains **no**
nuphus-mcp code and the nuphus-mcp repo is never modified by this package.

## Dev setup

```sh
npm ci
npm test          # config, quiet startup, and real MCP-client protocol bridge tests
npm pack --dry-run
```

## Layout

- `lib/config.js` — `DEFAULT_CLIENT_CONFIG`, `PASSTHROUGH_ENV`, `resolveConfig`
  (all unit-testable, no side effects)
- `lib/index.js` — Cordis `apply()`: auto-install `nuphus-mcp` if missing, then
  mount `@deepseek-ai/dsh-mcp-client` pre-configured for stdio
- `cordis.patch.yml` — the `dsh.bundle.patch` that auto-activates the plugin
- `fixtures/` — protocol server and minimal Cordis service boundary for tests;
  the real DSH MCP client/stdio transport are exercised without launching Chrome

## Rules

- Keep `PASSTHROUGH_ENV` in sync with the `NUPHUS_MCP_*` / `NUPHUS_BROWSER_*`
  variables nuphus-mcp actually reads.
- Run `npm test` before pushing. CI runs the same three steps on Linux; also run them locally on Windows when changing process startup.
- Browser tab reuse and CDP recovery belong to the nuphus-mcp binary. Keep this
  wrapper transparent to tool schemas, arguments and results; do not add write retries.
- Never commit changes to the `package-lock.json` without a corresponding
  `package.json` change.
