import { describe, it, expect } from 'vitest';

describe('MCP server smoke', () => {
  it('loads the KnowledgeGraphMCPServer module without throwing', async () => {
    const mod = await import('../src/mcp/KnowledgeGraphServer.js');
    expect(mod).toBeTruthy();
  });
});
