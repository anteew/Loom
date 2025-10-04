import GraphManager from '../graph/GraphManager.js';
import VectorManager from '../vector/VectorManager.js';
import IngestionPipeline from '../ingestion/IngestionPipeline.js';
import KnowledgeGraphMCPServer from './KnowledgeGraphServer.js';
import MaintenanceService from '../maintenance/MaintenanceService.js';
import { ChromaClient } from 'chromadb';

const llmClient = {
  async extractEntitiesAndRelations(chunk) {
    return { entities: [], relationships: [] };
  }
};

async function main() {
  const graphManager = new GraphManager(process.env.LOOM_DATA_DIR);
  const chroma = new ChromaClient({ path: process.env.CHROMA_PATH || undefined });
  const vectorManager = new VectorManager(chroma);
  await vectorManager.initialize();

  const ingestion = new IngestionPipeline(graphManager, vectorManager, llmClient);
  const maintenance = new MaintenanceService(graphManager, vectorManager, llmClient);

  const mcp = new KnowledgeGraphMCPServer(
    graphManager,
    vectorManager,
    ingestion,
    maintenance
  );
  await mcp.start();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
