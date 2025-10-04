import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export class KnowledgeGraphMCPServer {
  constructor(graphManager, vectorManager, ingestionPipeline) {
    this.graphManager = graphManager;
    this.vectorManager = vectorManager;
    this.ingestionPipeline = ingestionPipeline;
    this.server = new Server(
      { name: 'knowledge-graph', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    this.setupTools();
  }

  setupTools() {
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params ?? {};
      switch (name) {
        case 'process_chunk':
          return await this.ingestionPipeline.processChunk(args.chunk);

        case 'search_entities':
          return await this.vectorManager.searchSimilar(
            args.name,
            args.type,
            args.topK ?? 5
          );

        case 'get_entity':
          return this.graphManager.getEntity(args.id);

        case 'get_neighbors':
          return this.graphManager.getNeighbors(args.id, args.depth ?? 1);

        case 'add_entity':
          return this.graphManager.addEntity(args.entity);

        case 'add_relationship':
          return this.graphManager.addRelationship(args.relationship);

        case 'get_graph_stats':
          return this.graphManager.getStats();

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Knowledge Graph MCP Server running on stdio');
  }
}

export default KnowledgeGraphMCPServer;
