import { test, expect } from 'vitest';

import IngestionPipeline from '../src/ingestion/IngestionPipeline.js';
import { CONFIDENCE } from '../src/config/constants.js';

function makeGraphMock() {
  const nodes = new Map();
  const edges = new Map();
  return {
    addEntity: (e) => {
      nodes.set(e.id, e);
      return e;
    },
    updateEntity: (id, updates) => {
      const prev = nodes.get(id);
      const next = { ...prev, ...updates };
      nodes.set(id, next);
      return next;
    },
    getEntity: (id) => nodes.get(id) || null,
    addRelationship: (r) => {
      edges.set(r.id, r);
      return r;
    }
  };
}

test('createNewEntity enforces provenance and adds embedding when present', async () => {
  const gm = makeGraphMock();
  const vm = {
    addEmbedding: async () => {},
    searchSimilar: async () => []
  };
  const ip = new IngestionPipeline(gm, vm, { extractEntitiesAndRelations: async () => ({ entities: [], relationships: [] }) });
  await ip.createNewEntity(
    { id: 'e1', name: 'Alice', type: 'Person', embedding: [0.1, 0.2], confidence: 0.9 },
    { id: 'c1', text: 'Alice is a person.' }
  );
  const got = gm.getEntity('e1');
  expect(got).toBeTruthy();
  expect(got.sources.length).toBe(1);
});

test('updateExistingEntity respects REJECT threshold and merges sources', async () => {
  const gm = makeGraphMock();
  const vm = {
    updateEmbedding: async () => {},
    searchSimilar: async () => []
  };
  const ip = new IngestionPipeline(gm, vm, { extractEntitiesAndRelations: async () => ({ entities: [], relationships: [] }) });
  gm.addEntity({ id: 'e1', name: 'Alice', type: 'Person', sources: [], metadata: { version: 1, createdAt: '', updatedAt: '' } });

  const unchanged = await ip.updateExistingEntity('e1', { name: 'Alice', confidence: CONFIDENCE.REJECT - 0.01 }, { id: 'c1', text: 'low' });
  expect(unchanged.sources.length).toBe(0);

  const merged = await ip.updateExistingEntity('e1', { name: 'Alice', embedding: [1, 1], confidence: CONFIDENCE.REJECT }, { id: 'c2', text: 'ok' });
  expect(merged.sources.length).toBe(1);
});

test('addRelationshipWithProvenance requires provenance', async () => {
  const gm = makeGraphMock();
  const vm = { searchSimilar: async () => [] };
  const ip = new IngestionPipeline(gm, vm, { extractEntitiesAndRelations: async () => ({ entities: [], relationships: [] }) });
  const rel = await ip.addRelationshipWithProvenance(
    { id: 'r1', from: 'a', to: 'b', type: 'LINKS' },
    { id: 'c1', text: 'evidence' }
  );
  expect(rel.sources[0].chunkId).toBe('c1');
  expect(rel.metadata.version).toBe(1);
});

test('processChunk runs extraction and processing', async () => {
  const gm = makeGraphMock();
  const vm = {
    searchSimilar: async () => [],
    addEmbedding: async () => {}
  };
  const llm = {
    extractEntitiesAndRelations: async () => ({
      entities: [{ id: 'e1', name: 'Alice', type: 'Person', confidence: 0.9 }],
      relationships: [{ id: 'r1', from: 'e1', to: 'e1', type: 'SELF' }]
    })
  };
  const ip = new IngestionPipeline(gm, vm, llm);
  const res = await ip.processChunk({ id: 'chunk1', text: 'Alice.' });
  expect(res.entitiesProcessed).toBe(1);
});
