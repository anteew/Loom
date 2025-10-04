import { test, expect } from 'vitest';

import VectorManager from '../src/vector/VectorManager.js';

function makeChromaMock() {
  const store = { ids: [], embeddings: [], metadatas: [] };
  return {
    getOrCreateCollection: async () => ({
      add: async ({ ids, embeddings, metadatas }) => {
        ids.forEach((id, i) => {
          store.ids.push(id);
          store.embeddings.push(embeddings[i]);
          store.metadatas.push(metadatas[i]);
        });
      },
      get: async ({ where, limit }) => {
        const idxs = [];
        for (let i = 0; i < store.ids.length; i++) {
          if (!where || (where.type ? store.metadatas[i]?.type === where.type : true)) {
            idxs.push(i);
          }
        }
        const ids = idxs.map(i => store.ids[i]).slice(0, limit ?? idxs.length);
        const metadatas = idxs.map(i => store.metadatas[i]).slice(0, limit ?? idxs.length);
        return { ids, metadatas };
      },
      update: async ({ ids, embeddings }) => {
        ids.forEach((id, i) => {
          const idx = store.ids.indexOf(id);
          if (idx >= 0) store.embeddings[idx] = embeddings[i];
        });
      },
      delete: async ({ ids }) => {
        ids.forEach((id) => {
          const idx = store.ids.indexOf(id);
          if (idx >= 0) {
            store.ids.splice(idx, 1);
            store.embeddings.splice(idx, 1);
            store.metadatas.splice(idx, 1);
          }
        });
      },
      _debug: store
    })
  };
}

test('initialize and add/search/update/delete embedding', async () => {
  const chroma = makeChromaMock();
  const vm = new VectorManager(chroma);
  await vm.initialize();
  await vm.addEmbedding('e1', 'Alice', 'Person', [0.1, 0.2]);
  await vm.addEmbedding('e2', 'alice', 'Person', [0.3, 0.4]);
  await vm.addEmbedding('e3', 'Acme', 'Org', [0.5, 0.6]);

  const top = await vm.searchSimilar('Alice', 'Person', 5);
  expect(top.length).toBeGreaterThan(0);
  expect(top[0].similarity).toBe(1.0);

  await vm.updateEmbedding('e1', [0.9, 0.9]);
  const afterUpdate = await vm.searchSimilar('Alice', 'Person', 5);
  expect(afterUpdate.find(r => r.id === 'e1')).toBeTruthy();

  await vm.deleteEmbedding('e2');
  const afterDelete = await vm.searchSimilar('alice', 'Person', 5);
  expect(afterDelete.find(r => r.id === 'e2')).toBeFalsy();
});
