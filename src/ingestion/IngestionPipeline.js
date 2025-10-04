import { v4 as uuidv4 } from 'uuid';
import { CONFIDENCE } from '../config/constants.js';

export class IngestionPipeline {
  constructor(graphManager, vectorManager, llmClient) {
    this.graphManager = graphManager;
    this.vectorManager = vectorManager;
    this.llmClient = llmClient;
  }

  async processChunk(chunk) {
    const extracted = await this.extractInformation(chunk);

    for (const entity of extracted.entities ?? []) {
      const existing = await this.findExistingEntity(entity);
      if (existing) {
        await this.updateExistingEntity(existing.id, entity, chunk);
      } else {
        await this.createNewEntity(entity, chunk);
      }
    }

    for (const rel of extracted.relationships ?? []) {
      await this.addRelationshipWithProvenance(rel, chunk);
    }

    return { entitiesProcessed: (extracted.entities ?? []).length };
  }

  async extractInformation(chunk) {
    if (!this.llmClient?.extractEntitiesAndRelations) {
      return { entities: [], relationships: [] };
    }
    return this.llmClient.extractEntitiesAndRelations(chunk);
  }

  async findExistingEntity(entity) {
    const similar = await this.vectorManager.searchSimilar(entity.name, entity.type, 3);
    if (similar.length > 0 && similar[0].similarity > 0.85) {
      return this.graphManager.getEntity(similar[0].id);
    }
    return null;
  }

  async createNewEntity(entity, sourceChunk) {
    if (!sourceChunk?.id || !sourceChunk?.text) {
      throw new Error('Provenance required to create entity');
    }
    const now = new Date().toISOString();
    const newEntity = {
      id: entity.id ?? uuidv4(),
      name: entity.name,
      type: entity.type,
      aliases: entity.aliases ?? [],
      properties: entity.properties ?? {},
      embedding: entity.embedding ?? null,
      sources: [{
        chunkId: sourceChunk.id,
        text: sourceChunk.text,
        timestamp: now,
        confidence: entity.confidence ?? 1.0
      }],
      metadata: {
        createdAt: now,
        updatedAt: now,
        version: 1
      }
    };
    const created = this.graphManager.addEntity(newEntity);
    if (newEntity.embedding) {
      await this.vectorManager.addEmbedding(created.id, created.name, created.type, newEntity.embedding);
    }
    return created;
  }

  async updateExistingEntity(id, newData, sourceChunk) {
    if (!sourceChunk?.id || !sourceChunk?.text) {
      throw new Error('Provenance required to update entity');
    }
    const current = this.graphManager.getEntity(id);
    const now = new Date().toISOString();
    const sources = [
      ...(current?.sources ?? []),
      {
        chunkId: sourceChunk.id,
        text: sourceChunk.text,
        timestamp: now,
        confidence: newData.confidence ?? 1.0
      }
    ];

    const conf = newData.confidence ?? 1.0;
    if (conf < CONFIDENCE.REJECT) {
      return current;
    }

    const merged = this.graphManager.updateEntity(id, {
      ...current,
      ...newData,
      id,
      sources
    });

    if (newData.embedding) {
      await this.vectorManager.updateEmbedding(id, newData.embedding);
    }

    return merged;
  }

  async addRelationshipWithProvenance(rel, sourceChunk) {
    if (!sourceChunk?.id || !sourceChunk?.text) {
      throw new Error('Provenance required to create relationship');
    }
    const now = new Date().toISOString();
    const relWithProv = {
      ...rel,
      sources: [{
        chunkId: sourceChunk.id,
        text: sourceChunk.text,
        timestamp: now,
        confidence: rel.confidence ?? 1.0
      }],
      metadata: {
        ...(rel.metadata ?? {}),
        createdAt: now,
        updatedAt: now,
        version: 1,
        supersedes: null
      }
    };
    return this.graphManager.addRelationship(relWithProv);
  }
}

export default IngestionPipeline;
