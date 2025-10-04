export class VectorManager {
  constructor(chromaClient) {
    this.client = chromaClient;
    this.collection = null;
  }

  async initialize() {
    this.collection = await this.client.getOrCreateCollection({ name: 'entity_embeddings' });
  }

  async addEmbedding(entityId, name, type, embedding) {
    if (!this.collection) throw new Error('VectorManager not initialized');
    await this.collection.add({
      ids: [entityId],
      embeddings: [embedding],
      metadatas: [{ name, type }]
    });
    return { id: entityId };
  }

  async searchSimilar(name, type, topK = 5) {
    if (!this.collection) throw new Error('VectorManager not initialized');
    const results = await this.collection.get({
      where: type ? { type } : undefined,
      limit: 100
    });
    const scored = (results?.metadatas ?? []).map((m, i) => ({
      id: results.ids[i],
      name: m?.name,
      type: m?.type,
      similarity: (m?.name && name && m.name.toLowerCase() === name.toLowerCase()) ? 1.0 : 0.5
    }));
    return scored.sort((a, b) => b.similarity - a.similarity).slice(0, topK);
  }

  async updateEmbedding(entityId, embedding) {
    if (!this.collection) throw new Error('VectorManager not initialized');
    await this.collection.update({
      ids: [entityId],
      embeddings: [embedding]
    });
    return { id: entityId };
  }

  async deleteEmbedding(entityId) {
    if (!this.collection) throw new Error('VectorManager not initialized');
    await this.collection.delete({ ids: [entityId] });
    return { id: entityId };
  }
}

export default VectorManager;
