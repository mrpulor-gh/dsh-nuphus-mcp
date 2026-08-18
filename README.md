# dsh-nuphus-mcp

**DeepSeek Harness (DSH) plugin** that mounts the
[nuphus-mcp](https://github.com/mrpulor-gh/nuphus-mcp) desktop automation MCP
server as native DSH tools — computer use for your DSH agents.

This package contains **no nuphus-mcp code**. It is a thin Cordis wrapper that
spawns the existing `nuphus-mcp` binary over stdio through the official
`@deepseek-ai/dsh-mcp-client`, so the MCP server stays a plain stdio server and
the nuphus-mcp repo is untouched.

## Install

```sh
npx -p @deepseek-ai/dsh dsh plugin --profile web add github:mrpulor-gh/dsh-nuphus-mcp
```

Then restart `dsh --profile web`. The package declares a `dsh.bundle.patch`, so
the plugin activates automatically — no manual `cordis.patch.yml` editing.

## What you get

- All 38 nuphus-mcp tools register as `mcp__nuphus-mcp__*` (e.g.
  `mcp__nuphus-mcp__desktop_click`, `mcp__nuphus-mcp__browser_snapshot`).
- `--confirm-write` is enabled by default — write tools require an explicit
  `"confirm": true` argument.
- BYOK vision keys and the external-browser CDP endpoint are read from the
  same `NUPHUS_MCP_*` environment variables used by every other client.

## Requirements

- DeepSeek Harness with the `web` profile (`npx @deepseek-ai/dsh web`)
- Node.js `^22.19` or `>=24`
- `nuphus-mcp` on `PATH` (`npm install -g @nuphus/nuphus-mcp`) or override
  `command` in the plugin config
- DSH must run in the desktop session of the machine you want controlled

## Configuration

Defaults; override via `cordis.yml` / patch on the `dsh-nuphus-mcp` row:

| Field | Default | Description |
|-------|---------|-------------|
| `serverName` | `nuphus-mcp` | Tool namespace (`mcp__nuphus-mcp__*`) |
| `command` | `nuphus-mcp` | Executable to spawn |
| `args` | `["--confirm-write"]` | CLI arguments |
| `toolCallTimeoutMs` | `120000` | Per-call timeout (DSH default 60000 is too low for screenshots/OCR) |
| `reconnect.enabled` | `true` | Auto-reconnect after a drop |

## License

MIT