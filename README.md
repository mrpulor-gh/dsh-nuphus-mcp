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

- Discovers the connected server's tools as `mcp__nuphus-mcp__*`; the count and schemas depend on that server build
- Auto-installs `nuphus-mcp` on first boot if missing on `PATH`
- `--confirm-write` on by default (write tools need `"confirm": true`)
- Same `NUPHUS_MCP_*` env vars as every other client
- Keeps one MCP client for the plugin lifetime; tool calls preserve the server's descriptions, arguments and results

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
| `autoInstall` | `true` | Install the default command if missing on PATH; set `false` for managed installations |
| `toolCallTimeoutMs` | `120000` | Per-call timeout (screenshots/OCR exceed 60000) |

`autoInstall` must be a boolean. A custom `command` is always used as supplied,
including paths containing spaces or non-ASCII characters, and never triggers
an automatic install. Windows PATH probes and installer processes are hidden;
the MCP SDK also hides its stdio child process.

### Reuse the task page

Use a server build containing nuphus-mcp [PR #12](https://github.com/mrpulor-gh/nuphus-mcp/pull/12)
and [PR #13](https://github.com/mrpulor-gh/nuphus-mcp/pull/13), such as
[commit `0a689c1`](https://github.com/mrpulor-gh/nuphus-mcp/commit/0a689c14aa26638dca1638752e7a0e88c4f4fe20).
The published `v0.3.3` release predates those changes; a `0.3.3` version string
alone does not establish that the fixes are included. Updating this adapter or
auto-installing an older npm build cannot add the browser behavior by itself.

With that server build:

1. Use `mcp__nuphus-mcp__browser_navigate` for ordinary navigation. It reuses the
   selected task page, including the startup page, instead of opening another tab.
2. To use another existing tab or a site popup, list tabs and select its fresh
   index with `browser_switch_tab`. `target_id` identifies the tab; `selected`
   marks the task target and does not mean foreground focus.
3. Use `browser_new_tab` only when a separate tab is needed. New/switch calls
   default to background operation; pass `activate: true` only for an interaction
   that needs the foreground. The adapter forwards omitted, false and true
   values unchanged. Write calls still require `confirm: true` by default.
4. If the task tab closed, navigation can create one background replacement
   instead of taking over an unrelated tab. If a create request has an unknown
   outcome, list/select the intended tab before creating another one.

The first browser launch, an explicit activation and website-created popups can
still show a window. This wrapper does not intercept browser windows.

### Recovery boundaries

Browser CDP recovery is handled inside nuphus-mcp: it can reattach to a live
browser and selected target without reloading the document; cancellation keeps
the owned browser alive, and crash recovery reuses the fresh startup page.
The adapter does not automatically replay failed or timed-out write calls.

The current `@deepseek-ai/dsh-mcp-client` does **not** automatically reconnect a
disconnected MCP server process. Reload the plugin with HMR or restart DSH, then
list/select the intended task tab again. The old `reconnect` option was not
implemented by that client; it is now ignored with a diagnostic rather than
advertised as a working setting.

### Magpie / existing binaries

When Magpie already manages nuphus-mcp, use its existing binary. For a profile
using this adapter, apply these fields to the existing plugin row's `config`:

```yaml
command: 'D:\工具\Nuphus\nuphus-mcp.exe'
args: ['--confirm-write']
autoInstall: false
```

Replace the example with the actual managed path. If Magpie already mounts a
native MCP row for `serverName: nuphus-mcp`, use that row or this adapter; enabling
both claims the same tool namespace and is rejected by the MCP client. Reload
the relevant client after replacing a binary so existing sessions use the new build.

External-browser selection (`NUPHUS_MCP_BROWSER_CDP_URL`, `NUPHUS_BROWSER_*`),
the explicit intranet opt-in (`NUPHUS_MCP_ALLOW_PRIVATE_NAV`) and action-effect
waiting (`NUPHUS_MCP_EFFECT_TIMEOUT_MS`) pass through from the host. Explicit
`config.env` values take precedence; the adapter does not enable private-network
navigation or disable effect checks by default.

Tool list, vision keys and external-browser CDP setup live in the
[nuphus-mcp](https://github.com/mrpulor-gh/nuphus-mcp) README.

## License

MIT
