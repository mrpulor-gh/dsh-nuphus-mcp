// dsh-nuphus-mcp — DeepSeek Harness plugin
//
// Thin Cordis wrapper: mounts the official DSH MCP client
// (@deepseek-ai/dsh-mcp-client) pre-configured for the nuphus-mcp desktop
// automation server (stdio). This package contains NO nuphus-mcp code — it only
// spawns the existing `nuphus-mcp` binary as a child process, so the MCP server
// stays a plain stdio server and nothing in the nuphus-mcp repo changes.

import childProcess from 'node:child_process';

import { DEFAULT_CLIENT_CONFIG, PASSTHROUGH_ENV, resolveConfig } from './config.js';

function pickEnv(keys) {
  const env = {};
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== '') env[key] = value;
  }
  return env;
}

/** Checks PATH without a shell or a visible Windows helper window. */
function commandExists(command) {
  const probe = process.platform === 'win32' ? 'where.exe' : 'which';
  try {
    childProcess.execFileSync(probe, [command], { stdio: 'ignore', windowsHide: true });
    return true;
  } catch {
    return false;
  }
}

export const name = 'dsh-nuphus-mcp';

export async function apply(ctx, config = {}) {
  const logger = ctx.logger('dsh-nuphus-mcp');
  const { autoInstall, ...resolved } = resolveConfig(config);
  if (config.reconnect !== undefined) {
    logger.warn(
      'reconnect is not supported by the current DSH MCP client and is ignored. ' +
      'Browser CDP recovery belongs to nuphus-mcp; reload the plugin or restart DSH after a server disconnect.',
    );
  }

  const mod = await import('@deepseek-ai/dsh-mcp-client');
  const mcpClient = mod.default ?? mod;
  if (!mcpClient?.apply) {
    logger.error('@deepseek-ai/dsh-mcp-client not found — is the package installed?');
    return;
  }

  const command = resolved.command ?? DEFAULT_CLIENT_CONFIG.command;

  // Only the default command name is auto-managed; a custom `command` is the
  // user's responsibility.
  if (command === 'nuphus-mcp' && !commandExists(command)) {
    if (!autoInstall) {
      logger.error(
        'nuphus-mcp not found on PATH and autoInstall is false. ' +
        'Set command to the existing managed binary or install it manually before restarting DSH.',
      );
      return;
    }
    logger.warn(
      'nuphus-mcp not found on PATH — attempting auto-install (@nuphus/nuphus-mcp)...',
    );
    try {
      childProcess.execSync('npm install -g @nuphus/nuphus-mcp', { stdio: 'inherit', windowsHide: true });
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
    ...resolved,
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
