import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocketServer } from 'ws';
import { RoomManager } from './room.js';
import { isAllowedRocket } from './world.js';
import { NET_PROTOCOL_VERSION, normalizeRoomCode, sanitizePilotName } from '../js/net-utils.js';

const SITE_ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function parseOrigins(value) {
  return String(value || '')
    .split(',')
    .map(origin => origin.trim().replace(/\/+$/, '').toLowerCase())
    .filter(Boolean);
}

function normalizeOrigins(value) {
  if (Array.isArray(value)) return value.map(origin => String(origin).trim().replace(/\/+$/, '').toLowerCase()).filter(Boolean);
  return parseOrigins(value);
}

function loadConfig(overrides = {}) {
  const publicOrigins = overrides.publicOrigins !== undefined
    ? normalizeOrigins(overrides.publicOrigins)
    : parseOrigins(process.env.PUBLIC_ORIGIN || process.env.ALLOWED_ORIGINS);
  return {
    host: overrides.host || process.env.HOST || '127.0.0.1',
    port: Number.isFinite(Number(overrides.port)) ? Number(overrides.port) : Number(process.env.PORT || 8787),
    maxPlayers: Math.max(1, Number(overrides.maxPlayers) || Number(process.env.MAX_PLAYERS) || 16),
    maxRooms: Math.max(1, Number(overrides.maxRooms) || Number(process.env.MAX_ROOMS) || 100),
    idleMs: Math.max(30000, Number(overrides.idleMs) || Number(process.env.ROOM_IDLE_MS) || 300000),
    serveStatic: overrides.serveStatic ?? process.env.SERVE_STATIC === '1',
    publicOrigins: publicOrigins.length
      ? publicOrigins
      : ['http://localhost:8787', 'http://127.0.0.1:8787']
  };
}

function json(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(payload);
}

function text(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(body);
}

async function serveStatic(req, res) {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    text(res, 400, 'Bad request');
    return;
  }
  if (pathname === '/favicon.ico') {
    res.writeHead(204, { 'Cache-Control': 'no-store' });
    res.end();
    return;
  }
  if (pathname === '/') pathname = '/index.html';
  const allowed = pathname === '/index.html'
    || (pathname.startsWith('/js/') && pathname.endsWith('.js'))
    || (pathname.startsWith('/css/') && pathname.endsWith('.css'));
  if (!allowed) {
    text(res, 404, 'Not found');
    return;
  }
  const filePath = path.resolve(SITE_ROOT, `.${pathname}`);
  const relative = path.relative(SITE_ROOT, filePath);
  const topLevel = relative.split(path.sep)[0];
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)
    || (topLevel !== 'js' && topLevel !== 'css' && relative !== 'index.html')) {
    text(res, 403, 'Forbidden');
    return;
  }
  try {
    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });
    res.end(data);
  } catch {
    text(res, 404, 'Not found');
  }
}

function send(ws, message) {
  if (!ws || ws.readyState !== 1) return;
  if (ws.bufferedAmount > 1024 * 1024) return;
  ws.send(JSON.stringify(message));
}

export async function startServer(overrides = {}) {
  const config = loadConfig(overrides);
  const rooms = new RoomManager({
    maxPlayers: config.maxPlayers,
    maxRooms: config.maxRooms,
    idleMs: config.idleMs
  });
  const startedAt = Date.now();

  const server = http.createServer((req, res) => {
    let url;
    try {
      url = new URL(req.url, 'http://localhost');
    } catch {
      text(res, 400, 'Bad request');
      return;
    }
    if (url.pathname === '/api/config') {
      json(res, 200, {
        mode: 'server',
        protocol: NET_PROTOCOL_VERSION,
        wsUrl: '/ws',
        maxPlayers: config.maxPlayers
      });
      return;
    }
    if (url.pathname === '/health') {
      json(res, 200, {
        ok: true,
        mode: 'server',
        players: rooms.playerCount,
        rooms: rooms.roomCount,
        uptime: Math.floor((Date.now() - startedAt) / 1000)
      });
      return;
    }
    if (config.serveStatic) {
      serveStatic(req, res).catch(() => text(res, 500, 'Internal error'));
      return;
    }
    text(res, 404, 'Not found');
  });

  const wss = new WebSocketServer({
    server,
    path: '/ws',
    maxPayload: 16 * 1024,
    perMessageDeflate: false,
    verifyClient: (info, callback) => {
      const origin = String(info.origin || '').replace(/\/+$/, '').toLowerCase();
      if (!origin || config.publicOrigins.includes(origin)) {
        callback(true);
        return;
      }
      callback(false, 403, 'Forbidden');
    }
  });

  wss.on('error', () => {});

  wss.on('connection', ws => {
    ws.isAlive = true;
    ws.player = null;
    ws.room = null;
    const joinTimer = setTimeout(() => {
      if (!ws.player) ws.close(1008, 'join timeout');
    }, 10000);

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', raw => {
      try {
        let message;
        try {
          message = JSON.parse(raw.toString('utf8'));
        } catch {
          return;
        }
        if (!message || typeof message !== 'object' || typeof message.t !== 'string') return;

        if (!ws.player) {
          if (message.t !== 'join') {
            send(ws, { t: 'error', code: 'join_required', message: 'Kirim pesan join terlebih dahulu.' });
            return;
          }
          const name = sanitizePilotName(message.name);
          const rawRoom = typeof message.roomCode === 'string' ? message.roomCode.trim() : '';
          const roomCode = normalizeRoomCode(rawRoom);
          if (name.length < 2 || (rawRoom && roomCode.length < 3)) {
            send(ws, { t: 'error', code: 'invalid_identity', message: 'Nama atau kode ruangan tidak valid.' });
            ws.close(1008, 'invalid identity');
            return;
          }
          const rocketId = isAllowedRocket(message.rocketId) ? message.rocketId : 'nsx-vanguard';
          const room = rooms.getOrCreate(roomCode);
          if (!room) {
            send(ws, { t: 'error', code: 'server_full', message: 'Server sedang penuh. Coba lagi nanti.' });
            ws.close(1013, 'server full');
            return;
          }
          if (room.players.size >= config.maxPlayers) {
            send(ws, { t: 'error', code: 'room_full', message: 'Ruangan penuh.' });
            ws.close(1013, 'room full');
            return;
          }
          const player = { id: randomUUID(), name, rocketId, ws };
          if (!room.addPlayer(player)) {
            send(ws, { t: 'error', code: 'room_full', message: 'Ruangan penuh.' });
            ws.close(1013, 'room full');
            return;
          }
          ws.player = player;
          ws.room = room;
          clearTimeout(joinTimer);
          return;
        }

        ws.room.handleMessage(ws.player, message);
      } catch {
        send(ws, { t: 'error', code: 'bad_message', message: 'Pesan tidak valid.' });
      }
    });

    ws.on('close', () => {
      clearTimeout(joinTimer);
      if (ws.room && ws.player) ws.room.removePlayer(ws.player.id);
      ws.player = null;
      ws.room = null;
    });

    ws.on('error', () => {});
  });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, config.host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  return {
    config,
    server,
    wss,
    rooms,
    address: server.address(),
    close: async () => {
      clearInterval(heartbeat);
      for (const ws of wss.clients) ws.terminate();
      await new Promise(resolve => wss.close(() => resolve()));
      rooms.close();
      await new Promise((resolve, reject) => {
        server.close(error => error ? reject(error) : resolve());
      });
    }
  };
}

const isMain = process.argv[1]
  && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;

if (isMain) {
  startServer()
    .then(instance => {
      const { config, address } = instance;
      const host = typeof address === 'object' && address ? address.address : config.host;
      const port = typeof address === 'object' && address ? address.port : config.port;
      console.log(`NSE multiplayer server listening on http://${host}:${port}`);
      let stopping = false;
      const shutdown = () => {
        if (stopping) return;
        stopping = true;
        instance.close()
          .catch(error => console.error(error))
          .finally(() => process.exit(0));
      };
      process.once('SIGTERM', shutdown);
      process.once('SIGINT', shutdown);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
