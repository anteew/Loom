import { beforeEach, afterAll, test, expect } from 'vitest';

import fs from 'node:fs';
import path from 'node:path';
import GraphManager from '../src/graph/GraphManager.js';

const TEST_DIR = path.resolve(process.cwd(), '.loomdata-test');

function rmTestDir() {
  try {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  } catch {}
}

beforeEach(() => {
  rmTestDir();
});

afterAll(() => {
  rmTestDir();
});

test('add/get/update/delete entity and stats', () => {
  const gm = new GraphManager(TEST_DIR);
  const e = gm.addEntity({ name: 'Alice', type: 'Person', properties: { age: 30 } });
  expect(e.id).toBeTruthy();
  const fetched = gm.getEntity(e.id);
  expect(fetched.name).toBe('Alice');
  const updated = gm.updateEntity(e.id, { properties: { age: 31 } });
  expect(updated.metadata.version).toBeGreaterThanOrEqual((fetched.metadata.version ?? 1));
  const deleted = gm.deleteEntity(e.id);
  expect(deleted.deleted).toBe(true);
  const stats = gm.getStats();
  expect(typeof stats.nodeCount).toBe('number');
  expect(typeof stats.edgeCount).toBe('number');
});

test('add/get/update relationship requires endpoints', () => {
  const gm = new GraphManager(TEST_DIR);
  const a = gm.addEntity({ name: 'A', type: 'Node' });
  const b = gm.addEntity({ name: 'B', type: 'Node' });
  const rel = gm.addRelationship({ from: a.id, to: b.id, type: 'LINKS', properties: { w: 1 } });
  expect(rel.id).toBeTruthy();
  const got = gm.getRelationship(rel.id);
  expect(got.type).toBe('LINKS');
  const upd = gm.updateRelationship(rel.id, { properties: { w: 2 } });
  expect(upd.metadata.version).toBeGreaterThanOrEqual((got.metadata.version ?? 1));
});

test('getNeighbors depth traversal', () => {
  const gm = new GraphManager(TEST_DIR);
  const a = gm.addEntity({ name: 'A', type: 'Node' });
  const b = gm.addEntity({ name: 'B', type: 'Node' });
  const c = gm.addEntity({ name: 'C', type: 'Node' });
  gm.addRelationship({ from: a.id, to: b.id, type: 'LINKS' });
  gm.addRelationship({ from: b.id, to: c.id, type: 'LINKS' });
  const depth1 = gm.getNeighbors(a.id, 1);
  expect(depth1.find(x => x.id === b.id)).toBeTruthy();
  expect(depth1.find(x => x.id === c.id)).toBeFalsy();
  const depth2 = gm.getNeighbors(a.id, 2);
  expect(depth2.find(x => x.id === c.id)).toBeTruthy();
});

test('findPath within maxDepth', () => {
  const gm = new GraphManager(TEST_DIR);
  const a = gm.addEntity({ name: 'A', type: 'Node' });
  const b = gm.addEntity({ name: 'B', type: 'Node' });
  const c = gm.addEntity({ name: 'C', type: 'Node' });
  gm.addRelationship({ from: a.id, to: b.id, type: 'LINKS' });
  gm.addRelationship({ from: b.id, to: c.id, type: 'LINKS' });
  const p = gm.findPath(a.id, c.id, 3);
  expect(Array.isArray(p)).toBe(true);
  expect(p[0]).toBe(a.id);
  expect(p[p.length - 1]).toBe(c.id);
  const none = gm.findPath(c.id, a.id, 1);
  expect(none).toBeNull();
});

test('save and load persistence', () => {
  const gm1 = new GraphManager(TEST_DIR);
  const a = gm1.addEntity({ name: 'Persisted', type: 'Thing' });
  gm1.save();
  const gm2 = new GraphManager(TEST_DIR);
  const again = gm2.getEntity(a.id);
  expect(again).toBeTruthy();
  expect(again.name).toBe('Persisted');
});
