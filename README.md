# Loom

Knowledge Graph

This repository contains the scaffolded implementation of the Knowledge Graph RAG service described in Technical_Design_Specifications. It is a Node.js ESM project with clean, testable modules and an MCP server interface.

## Project Structure

- src/
  - config/
    - constants.js
  - graph/
    - GraphManager.js
  - vector/
    - VectorManager.js
  - ingestion/
    - IngestionPipeline.js
  - maintenance/
    - MaintenanceService.js
  - mcp/
    - KnowledgeGraphServer.js
    - index.js
- tests/
  - mcp.server.test.js
- package.json
- .gitignore

## Install

- Requires Node.js >= 18
- npm install

```
npm i
```

## Run MCP Server

Environment variables:
- LOOM_DATA_DIR: directory to persist graph JSON (default: ./.loomdata)
- CHROMA_PATH: optional path for a local Chroma server/database

Start:
```
npm run start:mcp
```

You should see:
```
Knowledge Graph MCP Server running on stdio
```

## What’s Implemented

- GraphManager: in-memory graph using Graphology with file persistence (export/import JSON). Entity/relationship CRUD, neighbors, simple BFS path, stats.
- VectorManager: Chroma collection initialization, add/update/delete embedding, simple name-based similarity stub.
- IngestionPipeline: provenance-enforced entity/relationship creation, confidence gating via shared constants, abstract LLM client for extraction.
- MaintenanceService: stubs per spec, ready to extend.
- MCP server: tools routed per spec (process_chunk, search_entities, get_entity, get_neighbors, add_entity, update_entity, add_relationship, get_graph_stats, run_maintenance, get_maintenance_report).

## Confidence & Safety Configuration

See src/config/constants.js:
```
export const CONFIDENCE = {
  AUTO_EXECUTE: 0.95,
  HUMAN_REVIEW: 0.75,
  REJECT: 0.75
};
```

## Tests

Minimal smoke test with Vitest:
```
npm test
```

## Next Steps (TODOs)

- Integrate real LLM provider into llmClient for extractEntitiesAndRelations.
- Use true embedding search for VectorManager.searchSimilar.
- Implement SQLite change_log table and write versioned audit history on graph mutations.
- Add validation rules (dates, required fields, relationship integrity).
- Expand test coverage and add linter/formatter.
