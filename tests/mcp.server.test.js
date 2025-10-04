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
