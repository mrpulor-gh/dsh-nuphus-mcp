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

- 动态发现并注册服务端工具为 `mcp__nuphus-mcp__*`，数量和 schema 由实际连接的服务端构建决定
- 首次启动时若 PATH 上没有 `nuphus-mcp` 会**自动安装**
- 默认开启 `--confirm-write`（写工具需显式 `"confirm": true`）
- 与其他客户端共用同一套 `NUPHUS_MCP_*` 环境变量
- 插件存活期间复用同一个 MCP 客户端；保留服务端工具描述、调用参数和返回内容

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
| `autoInstall` | `true` | 默认命令不在 PATH 时自动安装；受管理的安装可设为 `false` |
| `toolCallTimeoutMs` | `120000` | 单次调用超时（截图/OCR 超过 60000） |

`autoInstall` 必须是布尔值。自定义 `command` 始终按原值使用，支持空格和中文路径，
不会触发自动安装。Windows 命令探测和安装进程采用隐藏窗口选项，MCP SDK 也会隐藏
stdio 子进程窗口。

### 复用任务页面

请使用包含 nuphus-mcp [PR #12](https://github.com/mrpulor-gh/nuphus-mcp/pull/12)
和 [PR #13](https://github.com/mrpulor-gh/nuphus-mcp/pull/13) 的服务端构建，例如
[提交 `0a689c1`](https://github.com/mrpulor-gh/nuphus-mcp/commit/0a689c14aa26638dca1638752e7a0e88c4f4fe20)。
已发布的 `v0.3.3` 早于这些修改，仅凭 `0.3.3` 版本号无法确认是否包含修复。
只更新本适配器或自动安装旧 npm 构建，不会获得新的浏览器行为。

使用上述服务端时：

1. 普通导航使用 `mcp__nuphus-mcp__browser_navigate`，继续复用选定的任务页，
   首次导航也会接管启动页。
2. 需要使用另一已有标签页或网站弹窗时，先列出标签页，再用最新的 index 调用
   `browser_switch_tab`。`target_id` 是稳定标识；`selected` 表示任务目标，不代表前台焦点。
3. 只有确实需要独立标签页时才调用 `browser_new_tab`。新建和切换默认在后台完成；
   需要前台交互时显式传入 `activate: true`。适配器原样透传省略、false 和 true，
   写操作仍默认要求 `confirm: true`。
4. 任务页已关闭时，导航可以创建一个后台替代页，不接管无关标签页。
   开页结果未知时，先列出并选定目标，再决定是否新建，避免重复开页。

首次启动浏览器、显式激活和网站自身弹窗仍可能显示窗口。本适配器不拦截浏览器窗口。

### 恢复边界

浏览器 CDP 恢复由 nuphus-mcp 服务端处理：重新连接活浏览器及选定目标时不刷新文档；
取消重连保留受管浏览器进程，崩溃恢复复用新启动页。适配器不会自动重放失败或超时的写操作。

当前 `@deepseek-ai/dsh-mcp-client` **不支持 MCP 服务进程断线后的自动重连**。
需要通过 HMR 重载插件或重启 DSH，再次列出并选定任务页面。原先的 `reconnect`
配置实际未被该客户端实现，现在会提示其不受支持并忽略，不再把它描述为有效能力。

### Magpie / 已有程序

如果已通过 Magpie 管理 nuphus-mcp，请使用其现有程序。选择本适配器接入的 profile，
可将以下字段配置到已有插件条目的 `config`：

```yaml
command: 'D:\工具\Nuphus\nuphus-mcp.exe'
args: ['--confirm-write']
autoInstall: false
```

请把示例路径替换为实际受管路径。Magpie 已挂载 `serverName: nuphus-mcp` 的原生 MCP
条目时，应在该条目与本适配器之间选择一种；同时启用会占用相同工具命名空间，客户端会拒绝。
替换二进制后需要重新加载对应客户端，已有会话才会使用新构建。

外部浏览器选择（`NUPHUS_MCP_BROWSER_CDP_URL`、`NUPHUS_BROWSER_*`）、内网访问显式开关
（`NUPHUS_MCP_ALLOW_PRIVATE_NAV`）及动作效果等待（`NUPHUS_MCP_EFFECT_TIMEOUT_MS`）均可从
宿主透传。显式 `config.env` 优先；适配器不会默认开启内网访问或关闭效果检查。

工具清单、视觉密钥、外部浏览器 CDP 接入见
[nuphus-mcp](https://github.com/mrpulor-gh/nuphus-mcp) README。

## License

MIT
