import { createInterface } from 'node:readline';

const calls = [];
let initializes = 0;
const definitions = ['browser_navigate', 'browser_new_tab', 'browser_switch_tab', 'browser_list_tabs', 'browser_click'].map(name => ({
  name,
  description: name === 'browser_navigate' ? 'Reuse the selected task tab without activating it.' : name,
  inputSchema: {
    type: 'object',
    properties: name === 'browser_new_tab' || name === 'browser_switch_tab'
      ? { activate: { type: 'boolean', default: false } } : {},
  },
}));

/** A protocol fixture for bridge assertions; it does not simulate or launch Chrome. */
function reply(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

createInterface({ input: process.stdin }).on('line', line => {
  const request = JSON.parse(line);
  if (!Object.hasOwn(request, 'id')) return;
  if (request.method === 'initialize') {
    initializes++;
    reply(request.id, {
      protocolVersion: request.params.protocolVersion,
      serverInfo: { name: 'nuphus-contract-fixture', version: '1' },
      capabilities: { tools: {} },
    });
  } else if (request.method === 'tools/list') {
    reply(request.id, { tools: definitions });
  } else if (request.method === 'tools/call') {
    calls.push(request.params);
    if (request.params.name === 'browser_click' && request.params.arguments.mode === 'timeout') return;
    if (request.params.name === 'browser_click' && request.params.arguments.mode === 'error') {
      reply(request.id, { isError: true, content: [{ type: 'text', text: 'write outcome unknown; inspect the page before retrying' }] });
      return;
    }
    const value = request.params.name === 'browser_list_tabs'
      ? [{ index: 0, url: 'https://example.test/任务', title: '任务', target_id: 'stable-task-target', selected: true }]
      : request.params.arguments;
    reply(request.id, {
      content: [{ type: 'text', text: JSON.stringify(value) }],
      structuredContent: {
        pid: process.pid, initializes, calls,
        args: process.argv.slice(2),
        cdpUrl: process.env.NUPHUS_MCP_BROWSER_CDP_URL,
      },
    });
  } else {
    reply(request.id, {});
  }
});
