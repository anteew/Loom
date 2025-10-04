import fs from 'node:fs';
import path from 'node:path';
import Graph from 'graphology';
import { v4 as uuidv4 } from 'uuid';

export class GraphManager {
  constructor(persistencePath) {
    this.graph = new Graph({ multi: true, allowSelfLoops: true });
    this.persistencePath = persistencePath ?? path.resolve(process.cwd(), '.loomdata');
    if (!fs.existsSync(this.persistencePath)) fs.mkdirSync(this.persistencePath, { recursive: true });
    this._graphFile = path.join(this.persistencePath, 'graph.json');
    this.load();
  }

  addEntity(entity) {
    const id = entity.id ?? uuidv4();
    const now = new Date().toISOString();
    const value = {
      ...entity,
      id,
      deleted: false,
      metadata: {
        ...(entity.metadata ?? {}),
        createdAt: entity.metadata?.createdAt ?? now,
        updatedAt: now,
        version: entity.metadata?.version ?? 1
      }
    };
    if (!this.graph.hasNode(id)) {
      this.graph.addNode(id, value);
    } else {
      this.graph.setNodeAttributes(id, value);
    }
    return value;
  }

  updateEntity(id, updates) {
    if (!this.graph.hasNode(id)) throw new Error(`Entity not found: ${id}`);
    const prev = this.graph.getNodeAttributes(id);
    const next = {
      ...prev,
      ...updates,
      id,
      metadata: {
        ...prev.metadata,
        ...(updates.metadata ?? {}),
        updatedAt: new Date().toISOString(),
        version: (prev.metadata?.version ?? 1) + 1
      }
    };
    this.graph.setNodeAttributes(id, next);
    return next;
  }

  getEntity(id) {
    if (!this.graph.hasNode(id)) return null;
    return this.graph.getNodeAttributes(id);
  }

  deleteEntity(id) {
    if (!this.graph.hasNode(id)) throw new Error(`Entity not found: ${id}`);
    const prev = this.graph.getNodeAttributes(id);
    const next = { ...prev, deleted: true, metadata: { ...prev.metadata, updatedAt: new Date().toISOString() } };
    this.graph.setNodeAttributes(id, next);
    return next;
  }

  addRelationship(relationship) {
    const id = relationship.id ?? uuidv4();
    const now = new Date().toISOString();
    const { from, to } = relationship;
    if (!this.graph.hasNode(from) || !this.graph.hasNode(to)) {
      throw new Error('Both endpoints must exist before adding a relationship');
    }
    const value = {
      ...relationship,
      id,
      metadata: {
        ...(relationship.metadata ?? {}),
        createdAt: relationship.metadata?.createdAt ?? now,
        updatedAt: now,
        version: relationship.metadata?.version ?? 1
      }
    };
    if (!this.graph.hasEdge(id)) {
      this.graph.addEdgeWithKey(id, from, to, value);
    } else {
      this.graph.setEdgeAttributes(id, value);
    }
    return value;
  }

  updateRelationship(id, updates) {
    if (!this.graph.hasEdge(id)) throw new Error(`Relationship not found: ${id}`);
    const prev = this.graph.getEdgeAttributes(id);
    const next = {
      ...prev,
      ...updates,
      id,
      metadata: {
        ...prev.metadata,
        ...(updates.metadata ?? {}),
        updatedAt: new Date().toISOString(),
        version: (prev.metadata?.version ?? 1) + 1
      }
    };
    this.graph.setEdgeAttributes(id, next);
    return next;
  }

  getRelationship(id) {
    if (!this.graph.hasEdge(id)) return null;
    return this.graph.getEdgeAttributes(id);
  }

  getNeighbors(entityId, depth = 1) {
    if (!this.graph.hasNode(entityId)) return [];
    const visited = new Set([entityId]);
    let frontier = [entityId];
    for (let d = 0; d < depth; d++) {
      const nextFrontier = [];
      for (const n of frontier) {
        this.graph.forEachNeighbor(n, (nbr) => {
          if (!visited.has(nbr)) {
            visited.add(nbr);
            nextFrontier.push(nbr);
          }
        });
      }
      frontier = nextFrontier;
    }
    visited.delete(entityId);
    return Array.from(visited).map(id => this.getEntity(id));
  }

  findPath(fromId, toId, maxDepth = 3) {
    if (!this.graph.hasNode(fromId) || !this.graph.hasNode(toId)) return null;
    const queue = [[fromId]];
    const seen = new Set([fromId]);
    while (queue.length) {
      const path = queue.shift();
      const last = path[path.length - 1];
      if (path.length - 1 > maxDepth) continue;
      if (last === toId) return path;
      this.graph.forEachNeighbor(last, (nbr) => {
        if (!seen.has(nbr)) {
          seen.add(nbr);
          queue.push([...path, nbr]);
        }
      });
    }
    return null;
  }

  save() {
    const exported = this.graph.export();
    fs.writeFileSync(this._graphFile, JSON.stringify(exported, null, 2), 'utf-8');
  }

  load() {
    if (fs.existsSync(this._graphFile)) {
      const data = JSON.parse(fs.readFileSync(this._graphFile, 'utf-8'));
      this.graph.import(data);
    }
  }

  getStats() {
    const entityTypes = {};
    this.graph.forEachNode((id, attrs) => {
      const t = attrs?.type ?? 'Unknown';
      entityTypes[t] = (entityTypes[t] ?? 0) + 1;
    });
    const relationshipTypes = {};
    this.graph.forEachEdge((id, attrs) => {
      const t = attrs?.type ?? 'Unknown';
      relationshipTypes[t] = (relationshipTypes[t] ?? 0) + 1;
    });
    return {
      nodeCount: this.graph.order,
      edgeCount: this.graph.size,
      entityTypes,
      relationshipTypes
    };
  }
}

export default GraphManager;
