import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_CLIENT_CONFIG, PASSTHROUGH_ENV, resolveConfig } from '../lib/config.js';

test('default config enables --confirm-write and a generous timeout', () => {
  assert.deepEqual(DEFAULT_CLIENT_CONFIG.args, ['--confirm-write']);
  assert.equal(DEFAULT_CLIENT_CONFIG.toolCallTimeoutMs, 120000);
  assert.equal(DEFAULT_CLIENT_CONFIG.serverName, 'nuphus-mcp');
});

test('passthrough env covers vision, browser and model variables', () => {
  for (const key of [
    'NUPHUS_MCP_VISION_API_KEY',
    'NUPHUS_MCP_VISION_MODEL',
    'NUPHUS_MCP_BROWSER_CDP_URL',
    'NUPHUS_BROWSER_EXE_PATH',
    'NUPHUS_BROWSER_NAME',
    'NUPHUS_BROWSER_USER_DATA_DIR',
    'NUPHUS_MCP_CONFIRM_WRITE',
    'NUPHUS_MCP_NO_MODEL_DOWNLOAD',
    'NUPHUS_MCP_YOLO_MODEL_URL',
  ]) {
    assert.ok(PASSTHROUGH_ENV.includes(key), `missing ${key}`);
  }
});

test('resolveConfig merges overrides over defaults', () => {
  const cfg = resolveConfig({ command: 'C:\\custom\\nuphus-mcp.exe', toolCallTimeoutMs: '3000' });
  assert.equal(cfg.command, 'C:\\custom\\nuphus-mcp.exe');
  assert.equal(cfg.toolCallTimeoutMs, 3000);
  assert.equal(cfg.serverName, 'nuphus-mcp');
});

test('resolveConfig falls back on invalid timeout and args', () => {
  assert.equal(resolveConfig({ toolCallTimeoutMs: 'abc' }).toolCallTimeoutMs, 120000);
  assert.equal(resolveConfig({ toolCallTimeoutMs: '-5' }).toolCallTimeoutMs, 120000);
  assert.deepEqual(resolveConfig({ args: 'not-an-array' }).args, ['--confirm-write']);
});
