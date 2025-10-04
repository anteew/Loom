import { test, expect, vi } from 'vitest';

vi.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  return {
    Server: class {
      constructor() { this._handlers = {}; }
      setRequestHandler(spec, handler) {
        const key = typeof spec === 'string' ? spec : spec?.method;
        this._handlers[key] = handler;
      }
      async connect() {}
    }
  };
});
vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => {
  return { StdioServerTransport: class {} };
});

import GraphManager from '../src/graph/GraphManager.js';
import IngestionPipeline from '../src/ingestion/IngestionPipeline.js';
import KnowledgeGraphMCPServer from '../src/mcp/KnowledgeGraphServer.js';

test('MCP server constructs with managers and pipeline', () => {
  const gm = new GraphManager('./.loomdata-test');
  const vm = { searchSimilar: async () => [], initialize: async () => {} };
  const ip = new IngestionPipeline(gm, vm, { extractEntitiesAndRelations: async () => ({ entities: [], relationships: [] }) });
  const server = new KnowledgeGraphMCPServer(gm, vm, ip);
  expect(server).toBeTruthy();
});
