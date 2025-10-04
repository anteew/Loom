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

import KnowledgeGraphMCPServer from '../src/mcp/KnowledgeGraphServer.js';
function makeFakes() {
  const calls = [];
  return {
    graphManager: {
      addEntity: (entity) => { calls.push(['addEntity', entity]); return { ...entity, id: entity.id || 'e' }; },
      updateEntity: (id, updates) => { calls.push(['updateEntity', id, updates]); return { id, ...updates }; },
      getEntity: (id) => { calls.push(['getEntity', id]); return { id, name: 'x' }; },
      getNeighbors: (id, depth) => { calls.push(['getNeighbors', id, depth]); return [{ id: 'n1' }]; },
      addRelationship: (rel) => { calls.push(['addRelationship', rel]); return { ...rel, id: rel.id || 'r' }; },
      getStats: () => { calls.push(['getStats']); return { nodeCount: 1, edgeCount: 0, entityTypes: {}, relationshipTypes: {} }; }
    },
    vectorManager: {
      searchSimilar: async (name, type, topK) => { calls.push(['searchSimilar', name, type, topK]); return [{ id: 'e', similarity: 1 }]; }
    },
    ingestionPipeline: {
      processChunk: async (chunk) => { calls.push(['processChunk', chunk]); return { entitiesProcessed: 1 }; }
    },
    maintenanceService: {
      runMaintenance: async () => { calls.push(['runMaintenance']); return { duplicates: [], orphans: [] }; }
    },
    calls
  };
}

test('routes tool calls correctly and stores maintenance report', async () => {
  const f = makeFakes();
  const server = new KnowledgeGraphMCPServer(f.graphManager, f.vectorManager, f.ingestionPipeline, f.maintenanceService);

  const handler = server._toolsCallHandler ?? server.server?._handlers?.['tools/call'];

  const res1 = await handler({ params: { name: 'process_chunk', arguments: { chunk: { id: 'c1', text: 't' } } } });
  expect(res1.entitiesProcessed).toBe(1);

  const res2 = await handler({ params: { name: 'search_entities', arguments: { name: 'Alice', type: 'Person', topK: 3 } } });
  expect(Array.isArray(res2)).toBe(true);

  const e = await handler({ params: { name: 'get_entity', arguments: { id: 'e' } } });
  expect(e.id).toBe('e');

  const n = await handler({ params: { name: 'get_neighbors', arguments: { id: 'e', depth: 2 } } });
  expect(Array.isArray(n)).toBe(true);

  const ae = await handler({ params: { name: 'add_entity', arguments: { entity: { name: 'A' } } } });
  expect(ae.id).toBeTruthy();

  const ue = await handler({ params: { name: 'update_entity', arguments: { id: 'e', updates: { name: 'B' } } } });
  expect(ue.name).toBe('B');

  const ar = await handler({ params: { name: 'add_relationship', arguments: { relationship: { from: 'e', to: 'e', type: 'SELF' } } } });
  expect(ar.type).toBe('SELF');

  const gs = await handler({ params: { name: 'get_graph_stats', arguments: {} } } );
  expect(gs).toHaveProperty('nodeCount');

  const rm = await handler({ params: { name: 'run_maintenance', arguments: {} } });
  expect(rm.report).toBeTruthy();

  const gr = await handler({ params: { name: 'get_maintenance_report', arguments: {} } });
  expect(gr.report).toBeTruthy();
});
