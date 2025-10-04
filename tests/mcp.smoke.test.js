import { describe, it, expect } from 'vitest';

describe('MCP server smoke', () => {
  it('loads the MCP server module without throwing', async () => {
    const mod = await import('../src/mcp/index.js');
    expect(mod).toBeTruthy();
  });
});
