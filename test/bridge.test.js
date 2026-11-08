import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFile, mkdtemp, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { apply } from '../lib/index.js';
import { bridgeContext } from '../fixtures/bridge-context.js';

test('one DSH MCP connection preserves browser schemas, arguments and target metadata', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'dsh 中文路径 '));
  const fixture = join(directory, '服务器 fixture.mjs');
  const bridge = bridgeContext();
  t.after(async () => {
    await bridge.dispose();
    await unlink(fixture);
    await rmdir(directory);
  });
  await copyFile(new URL('../fixtures/mcp-server.mjs', import.meta.url), fixture);
  await apply(bridge.ctx, {
    command: process.execPath,
    args: [fixture, '--confirm-write'],
    autoInstall: false,
    toolCallTimeoutMs: 1000,
    env: { NUPHUS_MCP_BROWSER_CDP_URL: 'http://127.0.0.1:9222' },
  });
  await bridge.ready();
  const definition = name => bridge.tools.get(`mcp__nuphus-mcp__${name}`);
  const invoke = (name, args = {}) => definition(name).execute(args, {});
  assert.equal(bridge.tools.size, 5);
  assert.match(definition('browser_navigate').description, /Reuse the selected task tab/);
  for (const name of ['browser_new_tab', 'browser_switch_tab']) {
    assert.deepEqual(definition(name).parameters.properties.activate, { type: 'boolean', default: false });
    for (const args of [{ confirm: true }, { activate: false, confirm: true }, { activate: true, confirm: true }]) {
      const result = await invoke(name, args);
      assert.deepEqual(JSON.parse(result.content[0].text), args);
    }
  }
  await invoke('browser_navigate', { url: 'https://example.test/任务', confirm: true });
  await assert.rejects(invoke('browser_click', { mode: 'error', confirm: true }), /write outcome unknown/);
  await assert.rejects(invoke('browser_click', { mode: 'timeout', confirm: true }), /timed out/i);
  const result = await invoke('browser_list_tabs');
  assert.deepEqual(JSON.parse(result.content[0].text), [{
    index: 0, url: 'https://example.test/任务', title: '任务', target_id: 'stable-task-target', selected: true,
  }]);
  const state = result.structuredContent;
  assert.equal(state.initializes, 1);
  assert.deepEqual(state.args, ['--confirm-write']);
  assert.equal(state.cdpUrl, 'http://127.0.0.1:9222');
  for (const mode of ['error', 'timeout']) {
    assert.equal(state.calls.filter(call => call.name === 'browser_click' && call.arguments.mode === mode).length, 1);
  }
  const next = await invoke('browser_list_tabs');
  assert.equal(next.structuredContent.pid, state.pid);
  await bridge.dispose();
  assert.equal(bridge.tools.size, 0);
});
