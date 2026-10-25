import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RESPAWN_MS,
  applyAsteroidHit,
  applyEntityHit,
  createWorld,
  encodeAsteroids,
  respawnDue,
  setWorldWarp,
  snapshotEntities,
  validateShipState,
  worldTime
} from '../world.js';

test('world starts with entities, asteroids, and a clock', () => {
  const world = createWorld(1000);
  assert.equal(world.warp, 1);
  assert.equal(world.asteroids.length, 3000);
  assert.ok(world.entities.bumi);
  assert.equal(worldTime(world, 2500), 1.5);
});

test('warp accepts only supported multipliers', () => {
  const world = createWorld(1000);
  assert.equal(setWorldWarp(world, 10, 2000), true);
  assert.equal(world.warp, 10);
  assert.equal(worldTime(world, 3000), 11);
  assert.equal(setWorldWarp(world, 7, 3000), false);
  assert.equal(world.warp, 10);
});

test('entity hits, destruction, snapshot, and respawn work', () => {
  const world = createWorld(0);
  const hp = world.entities.bumi.hp;
  for (let i = 0; i < hp - 1; i++) {
    assert.deepEqual(applyEntityHit(world, 'bumi', 10), { kind: 'hit', id: 'bumi', hp: hp - i - 1 });
  }
  const destroyed = applyEntityHit(world, 'bumi', 10);
  assert.equal(destroyed.kind, 'destroy');
  assert.equal(destroyed.r, RESPAWN_MS);
  assert.equal(applyEntityHit(world, 'bumi', 10), null);
  const snap = snapshotEntities(world, 10);
  assert.equal(snap.bumi.hp, 0);
  assert.equal(snap.bumi.d, 1);
  assert.equal(snap.bumi.r, RESPAWN_MS);
  assert.deepEqual(respawnDue(world, 10 + RESPAWN_MS), ['bumi']);
  assert.equal(world.entities.bumi.destroyed, false);
  assert.equal(world.entities.bumi.hp, hp);
});

test('asteroid hits are idempotent and encoded as dead bits', () => {
  const world = createWorld(0);
  assert.equal(applyAsteroidHit(world, 0), true);
  assert.equal(applyAsteroidHit(world, 0), false);
  assert.equal(applyAsteroidHit(world, -1), false);
  assert.equal(applyAsteroidHit(world, 3000), false);
  const decoded = Buffer.from(encodeAsteroids(world), 'base64');
  assert.equal(decoded.length, 375);
  assert.equal(decoded[0] & 1, 1);
});

test('ship state is normalized and bounds-limited', () => {
  const player = { name: 'Alpha', rocketId: 'nsx-vanguard' };
  const state = validateShipState({ p: [1.234, -2.346, 3.456], y: Math.PI * 3, pi: 9, v: 2000 }, player);
  assert.ok(state);
  assert.deepEqual(state.p, [1.23, -2.35, 3.46]);
  assert.equal(state.y, -3.142);
  assert.equal(state.pi, 1.5);
  assert.equal(state.v, 1000);
  assert.equal(validateShipState({ p: [3000, 0, 0], y: 0, pi: 0 }, player), null);
  assert.equal(validateShipState({ p: [0, 0, 0] }, player), null);
});
