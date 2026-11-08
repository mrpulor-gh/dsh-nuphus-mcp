import { test } from 'node:test';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { apply } from '../lib/index.js';

/** Records plugin mounting and diagnostics without starting a server. */
function context() {
  const mounted = [];
  const errors = [];
  const warnings = [];
  return {
    mounted, errors, warnings,
    logger: () => ({ info() {}, warn: text => warnings.push(text), error: text => errors.push(text) }),
    plugin: (plugin, config) => mounted.push({ plugin, config }),
  };
}

/** Mocks both builtin import styles so tests cannot reach a real installer. */
function mockProcesses(t, probe, shell) {
  t.mock.method(childProcess, 'execFileSync', probe);
  t.mock.method(childProcess, 'execSync', shell);
  syncBuiltinESMExports();
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); });
}

test('PATH probing uses an argument array and hides Windows helper windows', async t => {
  const probes = [];
  mockProcesses(t, (...args) => { probes.push(args); return Buffer.from('found'); },
    () => { throw new Error('Unexpected shell command'); });
  const ctx = context();
  await apply(ctx);
  assert.equal(probes.length, 1);
  assert.equal(probes[0][0], process.platform === 'win32' ? 'where.exe' : 'which');
  assert.deepEqual(probes[0][1], ['nuphus-mcp']);
  assert.equal(probes[0][2].windowsHide, true);
  assert.equal(ctx.mounted.length, 1);
  assert.equal('autoInstall' in ctx.mounted[0].config, false);
  assert.equal('reconnect' in ctx.mounted[0].config, false);
});

test('managed installations can refuse npm installation when PATH is missing', async t => {
  let installs = 0;
  mockProcesses(t, () => { throw new Error('not found'); },
    () => { installs++; return Buffer.from(''); });
  const ctx = context();
  await apply(ctx, { autoInstall: false });
  assert.equal(installs, 0);
  assert.equal(ctx.mounted.length, 0);
  assert.match(ctx.errors.join('\n'), /autoInstall.*false/);
});

test('default auto-install still rechecks PATH and hides the installer', async t => {
  let probes = 0;
  const installs = [];
  mockProcesses(t, () => {
    if (++probes === 1) throw new Error('missing');
    return Buffer.from('found');
  }, (...args) => { installs.push(args); });
  const ctx = context();
  await apply(ctx);
  assert.equal(probes, 2);
  assert.equal(installs.length, 1);
  assert.equal(installs[0][0], 'npm install -g @nuphus/nuphus-mcp');
  assert.equal(installs[0][1].windowsHide, true);
  assert.equal(ctx.mounted.length, 1);
});

test('custom Chinese paths stay intact and never invoke discovery or installers', async t => {
  mockProcesses(t, () => { throw new Error('Unexpected probe'); },
    () => { throw new Error('Unexpected shell'); });
  const ctx = context();
  const command = 'D:\\工具 空格 & 路径\\nuphus-mcp.exe';
  await apply(ctx, { command, autoInstall: false, args: ['--confirm-write'] });
  assert.equal(ctx.mounted.length, 1);
  assert.equal(ctx.mounted[0].config.command, command);
  assert.deepEqual(ctx.mounted[0].config.args, ['--confirm-write']);
});

test('browser env overrides and legacy reconnect diagnostics reach the mount', async t => {
  const values = {
    NUPHUS_MCP_BROWSER_CDP_URL: 'http://127.0.0.1:9222',
    NUPHUS_BROWSER_USER_DATA_DIR: 'D:\\浏览器资料\\任务',
    NUPHUS_MCP_ALLOW_PRIVATE_NAV: '1',
    NUPHUS_MCP_EFFECT_TIMEOUT_MS: '3000',
  };
  for (const [key, value] of Object.entries(values)) {
    const previous = process.env[key];
    process.env[key] = value;
    t.after(() => { if (previous === undefined) delete process.env[key]; else process.env[key] = previous; });
  }
  const ctx = context();
  await apply(ctx, {
    command: '/managed/nuphus-mcp', reconnect: { enabled: true },
    env: { NUPHUS_MCP_BROWSER_CDP_URL: 'http://127.0.0.1:9333' },
  });
  const expected = {
    ...values,
    NUPHUS_MCP_BROWSER_CDP_URL: 'http://127.0.0.1:9333',
  };
  for (const [key, value] of Object.entries(expected)) {
    assert.equal(ctx.mounted[0].config.env[key], value, key);
  }
  assert.match(ctx.warnings.join('\n'), /reconnect/);
  assert.equal('reconnect' in ctx.mounted[0].config, false);
});
