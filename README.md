# dsh-nuphus-mcp

DSH plugin that mounts [nuphus-mcp](https://github.com/mrpulor-gh/nuphus-mcp)
as native DSH tools — computer use for your agents. No nuphus-mcp code inside:
a thin Cordis wrapper that spawns the `nuphus-mcp` binary over stdio via
`@deepseek-ai/dsh-mcp-client`.

## Install

```sh
npx -p @deepseek-ai/dsh dsh plugin --profile web add github:mrpulor-gh/dsh-nuphus-mcp
```

Restart `dsh --profile web` — activation is automatic (`dsh.bundle.patch`).

## What you get

- All 38 tools register as `mcp__nuphus-mcp__*`
- Auto-installs `nuphus-mcp` on first boot if missing on `PATH`
- `--confirm-write` on by default (write tools need `"confirm": true`)
- Same `NUPHUS_MCP_*` env vars as every other client

## Requirements

- DSH `web` profile, Node.js `^22.19` / `>=24`
- DSH must run in the desktop session of the controlled machine

## Config

Overridable in `cordis.yml` / patch:

| Field | Default | Description |
|-------|---------|-------------|
| `serverName` | `nuphus-mcp` | Tool namespace |
| `command` | `nuphus-mcp` | Executable to spawn |
| `args` | `["--confirm-write"]` | CLI args |
| `toolCallTimeoutMs` | `120000` | Per-call timeout (screenshots/OCR exceed 60000) |
| `reconnect.enabled` | `true` | Auto-reconnect |

Tool list, vision keys and external-browser CDP setup live in the
[nuphus-mcp](https://github.com/mrpulor-gh/nuphus-mcp) README.

## License

MIT
