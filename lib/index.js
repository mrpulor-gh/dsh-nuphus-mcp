// dsh-nuphus-mcp — DeepSeek Harness plugin
//
// Thin Cordis wrapper: mounts the official DSH MCP client
// (@deepseek-ai/dsh-mcp-client) pre-configured for the nuphus-mcp desktop
// automation server (stdio). This package contains NO nuphus-mcp code — it only
// spawns the existing `nuphus-mcp` binary as a child process, so the MCP server
// stays a plain stdio server and nothing in the nuphus-mcp repo changes.

import { execSync } from 'node:child_process';

import { DEFAULT_CLIENT_CONFIG, PASSTHROUGH_ENV, resolveConfig } from './config.js';

function pickEnv(keys) {
  const env = {};
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== '') env[key] = value;
  }
  return env;
}

// Whether an executable resolves on PATH (mirrors how the MCP client spawns it:
// where.exe on Windows, which elsewhere).
function commandExists(command) {
  const probe = process.platform === 'win32' ? `where ${command}` : `which ${command}`;
  try {
    execSync(probe, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export const name = 'dsh-nuphus-mcp';

export async function apply(ctx, config = {}) {
  const logger = ctx.logger('dsh-nuphus-mcp');

  const mod = await import('@deepseek-ai/dsh-mcp-client');
  const mcpClient = mod.default ?? mod;
  if (!mcpClient?.apply) {
    logger.error('@deepseek-ai/dsh-mcp-client not found — is the package installed?');
    return;
  }

  const command = config.command ?? DEFAULT_CLIENT_CONFIG.command;

  // Only the default command name is auto-managed; a custom `command` is the
  // user's responsibility.
  if (command === 'nuphus-mcp' && !commandExists(command)) {
    logger.warn(
      'nuphus-mcp not found on PATH — attempting auto-install (@nuphus/nuphus-mcp)...',
    );
    try {
      execSync('npm install -g @nuphus/nuphus-mcp', { stdio: 'inherit', windowsHide: true });
    } catch {
      logger.error(
        'auto-install failed. Install it manually and restart DSH:\n' +
          '  npm install -g @nuphus/nuphus-mcp\n' +
          'or set "command" to the absolute path of the nuphus-mcp binary.',
      );
      return; // fail loud instead of mounting a client that registers nothing
    }
    if (!commandExists(command)) {
      logger.error('nuphus-mcp still not found after auto-install. Aborting.');
      return;
    }
    logger.info('nuphus-mcp installed successfully.');
  }

  const clientConfig = {
    ...resolveConfig(config),
    env: {
      ...pickEnv(PASSTHROUGH_ENV),
      ...(config.env ?? {}),
    },
  };

  ctx.plugin(mcpClient, clientConfig);
  logger.info(
    `mounted @deepseek-ai/dsh-mcp-client -> ${clientConfig.command} (serverName=${clientConfig.serverName})`,
  );
}

export default { name, apply };