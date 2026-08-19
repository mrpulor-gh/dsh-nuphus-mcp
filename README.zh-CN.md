# dsh-nuphus-mcp

DSH 插件：把 [nuphus-mcp](https://github.com/mrpulor-gh/nuphus-mcp) 挂载为 DSH
原生工具——为你的智能体提供"计算机使用"能力。不含任何 nuphus-mcp 代码：只是
薄 Cordis 外壳，经 `@deepseek-ai/dsh-mcp-client` 以 stdio 拉起 `nuphus-mcp`
二进制。

## 安装

```sh
npx -p @deepseek-ai/dsh dsh plugin --profile web add github:mrpulor-gh/dsh-nuphus-mcp
```

重启 `dsh --profile web` 即自动激活（`dsh.bundle.patch`）。

## 效果

- 38 个工具全部注册为 `mcp__nuphus-mcp__*`
- 首次启动时若 PATH 上没有 `nuphus-mcp` 会**自动安装**
- 默认开启 `--confirm-write`（写工具需显式 `"confirm": true`）
- 与其他客户端共用同一套 `NUPHUS_MCP_*` 环境变量

## 环境要求

- DSH `web` profile，Node.js `^22.19` / `>=24`
- DSH 需运行在被控机器的桌面会话里

## 配置

可在 `cordis.yml` / patch 中覆盖：

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `serverName` | `nuphus-mcp` | 工具命名空间 |
| `command` | `nuphus-mcp` | 要启动的可执行文件 |
| `args` | `["--confirm-write"]` | 命令行参数 |
| `toolCallTimeoutMs` | `120000` | 单次调用超时（截图/OCR 超过 60000） |
| `reconnect.enabled` | `true` | 掉线自动重连 |

工具清单、视觉密钥、外部浏览器 CDP 接入见
[nuphus-mcp](https://github.com/mrpulor-gh/nuphus-mcp) README。

## License

MIT
