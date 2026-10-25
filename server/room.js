import { NET_PROTOCOL_VERSION } from '../js/net-utils.js';
import {
  applyAsteroidHit,
  applyEntityHit,
  createWorld,
  encodeAsteroids,
  respawnDue,
  setWorldWarp,
  snapshotEntities,
  validateShipState,
  worldTime
} from './world.js';

const SNAPSHOT_MS = 200;
const RESPAWN_TICK_MS = 250;
const HIT_COOLDOWN_MS = 110;
const MAX_MESSAGES_PER_SECOND = 180;

function send(ws, message) {
  if (!ws || ws.readyState !== 1) return;
  if (ws.bufferedAmount > 1024 * 1024) return;
  ws.send(JSON.stringify(message));
}

export class Room {
  constructor(key, options = {}) {
    this.key = key;
    this.code = options.code || '';
    this.isPublic = Boolean(options.isPublic);
    this.maxPlayers = Math.max(1, Number(options.maxPlayers) || 16);
    this.idleMs = Math.max(30000, Number(options.idleMs) || 300000);
    this.onEmpty = options.onEmpty || (() => {});
    this.players = new Map();
    this.closed = false;
    this.controllerId = null;
    this.seq = 0;
    this.world = createWorld();
    this.emptyTimer = null;
    this.snapshotTimer = setInterval(() => this.broadcastWorld(), SNAPSHOT_MS);
    this.respawnTimer = setInterval(() => this.respawnTick(), RESPAWN_TICK_MS);
  }

  buildSnapshot() {
    const now = performance.now();
    return {
      h: this.controllerId || '',
      w: Number(worldTime(this.world, now).toFixed(3)),
      warp: this.world.warp,
      seq: this.seq++,
      ents: snapshotEntities(this.world, now),
      ast: encodeAsteroids(this.world)
    };
  }

  publicPlayer(player) {
    return {
      id: player.id,
      name: player.name,
      rocketId: player.rocketId,
      state: player.state
    };
  }

  addPlayer(player) {
    if (this.closed) return false;
    if (this.players.size >= this.maxPlayers) return false;
    if (!this.controllerId) this.controllerId = player.id;
    if (this.emptyTimer) {
      clearTimeout(this.emptyTimer);
      this.emptyTimer = null;
    }
    player.lastHitAt = 0;
    player.messageAt = 0;
    player.messageCount = 0;
    player.state = null;
    this.players.set(player.id, player);
    send(player.ws, {
      t: 'welcome',
      protocol: NET_PROTOCOL_VERSION,
      selfId: player.id,
      room: { code: this.code, isPublic: this.isPublic },
      controllerId: this.controllerId,
      snapshot: this.buildSnapshot(),
      players: [...this.players.values()].map(item => this.publicPlayer(item)),
      serverTime: Date.now()
    });
    this.broadcast({
      t: 'peer',
      action: 'join',
      player: this.publicPlayer(player)
    }, player.id);
    return true;
  }

  removePlayer(id) {
    const player = this.players.get(id);
    if (!player) return;
    this.players.delete(id);
    if (this.closed) return;
    this.broadcast({
      t: 'peer',
      action: 'leave',
      id,
      name: player.name
    });
    if (this.controllerId === id) {
      this.controllerId = this.players.keys().next().value || null;
      this.broadcastWorld();
    }
    if (!this.players.size) {
      this.emptyTimer = setTimeout(() => {
        this.close();
        this.onEmpty(this);
      }, this.idleMs);
    }
  }

  broadcast(message, exceptId) {
    for (const player of this.players.values()) {
      if (player.id === exceptId) continue;
      send(player.ws, message);
    }
  }

  broadcastWorld() {
    if (!this.players.size) return;
    this.broadcast({ t: 'world', ...this.buildSnapshot() });
  }

  respawnTick() {
    if (!this.players.size) return;
    const ids = respawnDue(this.world);
    for (const id of ids) {
      this.broadcast({ t: 'event', h: this.controllerId, kind: 'respawn', id });
    }
  }

  handleMessage(player, message) {
    if (!message || typeof message !== 'object' || typeof message.t !== 'string') return;
    const now = Date.now();
    if (now - player.messageAt >= 1000) {
      player.messageAt = now;
      player.messageCount = 0;
    }
    player.messageCount++;
    if (player.messageCount > MAX_MESSAGES_PER_SECOND) {
      player.ws.close(1008, 'rate limit');
      return;
    }

    if (message.t === 'state') {
      const state = validateShipState(message, player);
      if (!state) return;
      player.state = state;
      this.broadcast({ t: 'state', id: player.id, data: state }, player.id);
      return;
    }

    if (message.t === 'hit') {
      if (now - player.lastHitAt < HIT_COOLDOWN_MS) return;
      player.lastHitAt = now;
      if (message.kind === 'asteroid') {
        if (!applyAsteroidHit(this.world, message.i)) return;
        this.broadcast({
          t: 'event',
          h: this.controllerId,
          kind: 'destroy',
          i: message.i
        });
        return;
      }
      if (message.kind === 'entity') {
        const event = applyEntityHit(this.world, message.id);
        if (!event) return;
        this.broadcast({ t: 'event', h: this.controllerId, ...event });
      }
      return;
    }

    if (message.t === 'warp') {
      if (player.id !== this.controllerId) {
        send(player.ws, { t: 'error', code: 'not_controller', message: 'Hanya controller dunia yang dapat mengubah warp.' });
        return;
      }
      if (!setWorldWarp(this.world, message.warp)) return;
      this.broadcast({
        t: 'warp',
        h: this.controllerId,
        w: Number(worldTime(this.world).toFixed(3)),
        warp: this.world.warp
      });
      this.broadcastWorld();
      return;
    }

    if (message.t === 'ping') {
      send(player.ws, {
        t: 'pong',
        ts: message.ts,
        serverTime: Date.now()
      });
    }
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    clearInterval(this.snapshotTimer);
    clearInterval(this.respawnTimer);
    if (this.emptyTimer) clearTimeout(this.emptyTimer);
    this.emptyTimer = null;
    this.snapshotTimer = null;
    this.respawnTimer = null;
  }
}

export class RoomManager {
  constructor(options = {}) {
    this.maxPlayers = Math.max(1, Number(options.maxPlayers) || 16);
    this.maxRooms = Math.max(1, Number(options.maxRooms) || 100);
    this.idleMs = Math.max(30000, Number(options.idleMs) || 300000);
    this.rooms = new Map();
  }

  getOrCreate(roomCode) {
    const isPublic = !roomCode;
    const key = isPublic ? 'public' : `room:${roomCode}`;
    let room = this.rooms.get(key);
    if (room) return room;
    if (this.rooms.size >= this.maxRooms) return null;
    room = new Room(key, {
      code: roomCode,
      isPublic,
      maxPlayers: this.maxPlayers,
      idleMs: this.idleMs,
      onEmpty: closed => this.rooms.delete(closed.key)
    });
    this.rooms.set(key, room);
    return room;
  }

  get roomCount() {
    return this.rooms.size;
  }

  get playerCount() {
    let total = 0;
    for (const room of this.rooms.values()) total += room.players.size;
    return total;
  }

  close() {
    for (const room of this.rooms.values()) room.close();
    this.rooms.clear();
  }
}
