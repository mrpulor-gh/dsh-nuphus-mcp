# dsh-nuphus-mcp

**DeepSeek Harness（DSH）插件**：把
[nuphus-mcp](https://github.com/mrpulor-gh/nuphus-mcp) 桌面自动化 MCP Server
挂载为 DSH 原生工具——为你的 DSH 智能体提供"计算机使用"能力。

本包**不包含任何 nuphus-mcp 代码**。它只是薄薄的 Cordis 外壳：经官方
`@deepseek-ai/dsh-mcp-client` 以 stdio 拉起现有的 `nuphus-mcp` 二进制。
MCP Server 始终保持纯 stdio 形态，nuphus-mcp 仓库一行不改。

## 安装

```sh
npx -p @deepseek-ai/dsh dsh plugin --profile web add github:mrpulor-gh/dsh-nuphus-mcp
```

然后重启 `dsh --profile web`。本包声明了 `dsh.bundle.patch`，插件会自动激活，
无需手动编辑 `cordis.patch.yml`。

## 效果

- 38 个 nuphus-mcp 工具全部注册为 `mcp__nuphus-mcp__*`
  （如 `mcp__nuphus-mcp__desktop_click`、`mcp__nuphus-mcp__browser_snapshot`）。
- 默认开启 `--confirm-write`——写工具必须显式携带 `"confirm": true`。
- BYOK 视觉密钥与外部浏览器 CDP 地址继续读同一套 `NUPHUS_MCP_*` 环境变量，
  与其他客户端完全一致。

## 环境要求

- DeepSeek Harness `web` profile（`npx @deepseek-ai/dsh web`）
- Node.js `^22.19` 或 `>=24`
- `nuphus-mcp` 已在 PATH（`npm install -g @nuphus/nuphus-mcp`），或在插件配置里
  覆盖 `command`
- DSH 需运行在被控机器的桌面会话里

## 配置

默认值如下，可在 `cordis.yml` / patch 的 `dsh-nuphus-mcp` 行覆盖：

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `serverName` | `nuphus-mcp` | 工具命名空间（`mcp__nuphus-mcp__*`） |
| `command` | `nuphus-mcp` | 要启动的可执行文件 |
| `args` | `["--confirm-write"]` | 命令行参数 |
| `toolCallTimeoutMs` | `120000` | 单次调用超时（DSH 默认 60000，截图/OCR 会超时） |
| `reconnect.enabled` | `true` | 掉线后自动重连 |

## License

MIT