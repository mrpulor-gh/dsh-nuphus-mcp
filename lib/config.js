// Central plugin configuration: MCP client defaults plus the nuphus-mcp
// environment variables passed through from the host.

export const DEFAULT_CLIENT_CONFIG = {
  serverName: 'nuphus-mcp',
  transport: 'stdio',
  command: 'nuphus-mcp',
  args: ['--confirm-write'],
  toolCallTimeoutMs: 120000,
  failOnStartupError: true,
  reconnect: { enabled: true },
};

// BYOK vision / external-browser env vars pass through from the host
// environment, so users keep using the same NUPHUS_MCP_* variables everywhere.
export const PASSTHROUGH_ENV = [
  'NUPHUS_MCP_VISION_API_KEY',
  'NUPHUS_MCP_VISION_BASE_URL',
  'NUPHUS_MCP_VISION_MODEL',
  'NUPHUS_MCP_VISION_PROVIDER',
  'NUPHUS_MCP_VISION_MAX_TOKENS',
  'NUPHUS_MCP_BROWSER_CDP_URL',
  'NUPHUS_BROWSER_EXE_PATH',
  'NUPHUS_BROWSER_NAME',
  'NUPHUS_BROWSER_USER_DATA_DIR',
  'NUPHUS_MCP_CONFIRM_WRITE',
  'NUPHUS_MCP_NO_MODEL_DOWNLOAD',
  'NUPHUS_MCP_YOLO_MODEL_URL',
];
