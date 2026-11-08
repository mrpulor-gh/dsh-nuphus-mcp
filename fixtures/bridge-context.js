/** Minimal Cordis service boundary; the mounted MCP client and transport remain real. */
export function bridgeContext() {
  const tools = new Map();
  const disposers = [];
  const startups = [];
  const messages = [];
  const logger = Object.assign(() => logger, {
    info: text => messages.push(text),
    warn: text => messages.push(text),
    error: text => messages.push(text),
  });
  const ctx = {
    root: {}, logger,
    tools: {
      register(definition) {
        if (tools.has(definition.name)) throw new Error('Duplicate tool namespace');
        tools.set(definition.name, definition);
        return () => tools.delete(definition.name);
      },
    },
    effect(callback) { disposers.push(callback()); },
    plugin(plugin, config) {
      const startup = plugin.apply(ctx, config);
      startup.catch(() => {});
      startups.push(startup);
    },
  };
  return {
    ctx, tools, messages,
    ready: () => Promise.all(startups),
    async dispose() { while (disposers.length) await disposers.pop()(); },
  };
}
