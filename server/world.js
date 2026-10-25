import {
  PLANETS,
  BONUS,
  ROCKETS,
  SUN,
  EXOPLANETS,
  MILKYWAY,
  GALAXIES,
  BLACKHOLE
} from '../js/dataPlanets.js';
import { ASTEROID_COUNT } from '../js/net-utils.js';

export const RESPAWN_MS = 60000;
export const ROCKET_IDS = new Set(ROCKETS.map(rocket => rocket.id));

const ENTITY_DATA = [
  ...PLANETS,
  ...BONUS,
  SUN,
  ...EXOPLANETS,
  ...MILKYWAY,
  ...GALAXIES,
  BLACKHOLE
];

export function createWorld(now = performance.now()) {
  const entities = Object.create(null);
  for (const data of ENTITY_DATA) {
    if (!data?.id) continue;
    const hp = Math.max(1, Math.round(Number(data.hp) || 1));
    entities[data.id] = { hp, maxHp: hp, destroyed: false, respawnAt: 0 };
  }
  return {
    warp: 1,
    anchor: 0,
    anchorAt: now,
    entities,
    asteroids: new Uint8Array(ASTEROID_COUNT).fill(1)
  };
}

export function worldTime(world, now = performance.now()) {
  return world.anchor + (now - world.anchorAt) / 1000 * world.warp;
}

export function setWorldWarp(world, warp, now = performance.now()) {
  if (![1, 10, 100].includes(Number(warp))) return false;
  world.anchor = worldTime(world, now);
  world.anchorAt = now;
  world.warp = Number(warp);
  return true;
}

export function setWorldTime(world, time, now = performance.now()) {
  if (!Number.isFinite(Number(time))) return false;
  world.anchor = Number(time);
  world.anchorAt = now;
  return true;
}

export function snapshotEntities(world, now = performance.now()) {
  const output = Object.create(null);
  for (const [id, entity] of Object.entries(world.entities)) {
    output[id] = {
      hp: entity.destroyed ? 0 : Math.max(0, Math.min(entity.maxHp, Math.round(entity.hp))),
      d: entity.destroyed ? 1 : 0,
      r: entity.destroyed ? Math.max(0, Math.round(entity.respawnAt - now)) : 0
    };
  }
  return output;
}

export function encodeAsteroids(world) {
  const bytes = new Uint8Array(Math.ceil(ASTEROID_COUNT / 8));
  for (let i = 0; i < ASTEROID_COUNT; i++) {
    if (!world.asteroids[i]) bytes[i >> 3] |= 1 << (i & 7);
  }
  return Buffer.from(bytes).toString('base64');
}

export function applyEntityHit(world, id, now = performance.now()) {
  if (typeof id !== 'string') return null;
  const entity = world.entities[id];
  if (!entity || entity.destroyed) return null;
  entity.hp = Math.max(0, entity.hp - 1);
  if (entity.hp > 0) return { kind: 'hit', id, hp: entity.hp };
  entity.destroyed = true;
  entity.respawnAt = now + RESPAWN_MS;
  return { kind: 'destroy', id, hp: 0, r: RESPAWN_MS };
}

export function applyAsteroidHit(world, index) {
  if (!Number.isInteger(index) || index < 0 || index >= ASTEROID_COUNT) return false;
  if (!world.asteroids[index]) return false;
  world.asteroids[index] = 0;
  return true;
}

export function respawnDue(world, now = performance.now()) {
  const respawned = [];
  for (const [id, entity] of Object.entries(world.entities)) {
    if (!entity.destroyed || now < entity.respawnAt) continue;
    entity.destroyed = false;
    entity.hp = entity.maxHp;
    entity.respawnAt = 0;
    respawned.push(id);
  }
  return respawned;
}

export function isAllowedRocket(id) {
  return typeof id === 'string' && ROCKET_IDS.has(id);
}

export function isAllowedWarp(value) {
  return [1, 10, 100].includes(Number(value));
}

export function validateShipState(data, player) {
  if (!data || typeof data !== 'object') return null;
  const position = Array.isArray(data.p) ? data.p : null;
  if (!position || position.length < 3) return null;
  const x = Number(position[0]);
  const y = Number(position[1]);
  const z = Number(position[2]);
  const yaw = Number(data.y);
  const pitch = Number(data.pi);
  const speed = Number(data.v);
  if (![x, y, z, yaw, pitch].every(Number.isFinite)) return null;
  if (Math.abs(x) > 2600 || Math.abs(y) > 2600 || Math.abs(z) > 2600) return null;
  const normalizedYaw = ((yaw + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return {
    n: player.name,
    r: player.rocketId,
    p: [
      Number(x.toFixed(2)),
      Number(y.toFixed(2)),
      Number(z.toFixed(2))
    ],
    y: Number(normalizedYaw.toFixed(3)),
    pi: Number(Math.max(-1.5, Math.min(1.5, pitch)).toFixed(3)),
    v: Number(Math.max(0, Math.min(1000, Number.isFinite(speed) ? speed : 0)).toFixed(2))
  };
}
