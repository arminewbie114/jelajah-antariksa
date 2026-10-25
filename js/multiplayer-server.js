import { NET_PROTOCOL_VERSION, normalizeRoomCode } from './net-utils.js';

const JOIN_TIMEOUT_MS = 9000;
const PING_INTERVAL_MS = 2000;

function resolveSocketUrl(wsUrl) {
  const target = String(wsUrl || '/ws');
  if (/^wss?:\/\//i.test(target)) return target;
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${location.host}${target.startsWith('/') ? target : `/${target}`}`;
}

export async function startMultiplayer(options = {}) {
  const initial = (() => {
    try { return options.getLocalState?.() || {}; } catch { return {}; }
  })();
  const roomCode = normalizeRoomCode(options.roomCode);
  const url = resolveSocketUrl(options.serverConfig?.wsUrl);
  const ws = new WebSocket(url);
  const players = new Map();
  const queue = [];
  let selfId = '';
  let controllerId = '';
  let joined = false;
  let started = false;
  let closed = false;
  let pingTimer = null;
  let joinTimer = null;
  let resolveReady;
  let rejectReady;

  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  const deliver = callback => {
    if (started) callback();
    else queue.push(callback);
  };

  const fail = error => {
    if (closed) return;
    closed = true;
    clearTimeout(joinTimer);
    if (pingTimer) clearInterval(pingTimer);
    try { ws.close(); } catch {}
    if (!joined) {
      rejectReady(error);
      return;
    }
    options.onDisconnect?.();
  };

  const send = message => {
    if (!joined || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(message));
  };

  const net = {
    selfId: '',
    roomId: roomCode ? `server-${roomCode}` : 'server-public',
    roomCode,
    isPublic: !roomCode,
    usingTurn: false,
    isServer: true,
    getPeerIds: () => [...players.keys()],
    getPeerCount: () => players.size,
    sendState: () => {
      const state = (() => {
        try { return options.getLocalState?.(); } catch { return null; }
      })();
      if (!state) return;
      send({ t: 'state', p: state.p, y: state.y, pi: state.pi, v: state.v });
    },
    sendWorld: message => {
      if (!message || typeof message !== 'object') return;
      if (message.k === 'hit') {
        if (message.kind === 'asteroid') send({ t: 'hit', kind: 'asteroid', i: message.i });
        else if (message.kind === 'entity') send({ t: 'hit', kind: 'entity', id: message.id });
        return;
      }
      if (message.k === 'warp') send({ t: 'warp', warp: message.warp });
    },
    leave: () => {
      if (closed) return;
      closed = true;
      clearTimeout(joinTimer);
      if (pingTimer) clearInterval(pingTimer);
      try { ws.close(1000, 'leave'); } catch {}
    }
  };

  const applyWelcome = message => {
    if (Number(message.protocol) !== NET_PROTOCOL_VERSION) {
      fail(new Error('Versi protokol server tidak cocok. Muat ulang halaman.'));
      return;
    }
    joined = true;
    selfId = String(message.selfId || '');
    controllerId = String(message.controllerId || '');
    net.selfId = selfId;
    players.clear();
    for (const player of Array.isArray(message.players) ? message.players : []) {
      if (!player || typeof player.id !== 'string' || player.id === selfId) continue;
      players.set(player.id, player);
    }
    resolveReady(net);
    setTimeout(() => {
      if (closed) return;
      started = true;
      for (const player of players.values()) {
        options.onPeerJoin?.(player.id);
        if (player.state) options.onState?.(player.id, player.state);
      }
      const snapshot = message.snapshot || {};
      options.onWorld?.(selfId, {
        k: 'snap',
        h: String(snapshot.h || controllerId),
        w: Number(snapshot.w) || 0,
        warp: Number(snapshot.warp) || 1,
        seq: Number(snapshot.seq) || 0,
        ents: snapshot.ents || {},
        ast: typeof snapshot.ast === 'string' ? snapshot.ast : ''
      });
      while (queue.length) queue.shift()();
    }, 0);
  };

  const handleMessage = message => {
    if (!message || typeof message !== 'object' || typeof message.t !== 'string') return;
    if (message.t === 'welcome') {
      applyWelcome(message);
      return;
    }
    if (message.t === 'peer') {
      const player = message.player;
      if (message.action === 'join' && player && typeof player.id === 'string') {
        if (player.id === selfId) return;
        players.set(player.id, player);
        deliver(() => {
          options.onPeerJoin?.(player.id);
          if (player.state) options.onState?.(player.id, player.state);
        });
      } else if (message.action === 'leave' && typeof message.id === 'string') {
        players.delete(message.id);
        deliver(() => options.onPeerLeave?.(message.id));
      }
      return;
    }
    if (message.t === 'state' && typeof message.id === 'string') {
      if (message.id === selfId) return;
      const player = players.get(message.id);
      if (player) player.state = message.data;
      deliver(() => options.onState?.(message.id, message.data));
      return;
    }
    if (message.t === 'world') {
      controllerId = String(message.h || controllerId);
      deliver(() => options.onWorld?.(selfId, {
        k: 'snap',
        h: controllerId,
        w: Number(message.w) || 0,
        warp: Number(message.warp) || 1,
        seq: Number(message.seq) || 0,
        ents: message.ents || {},
        ast: typeof message.ast === 'string' ? message.ast : ''
      }));
      return;
    }
    if (message.t === 'event') {
      deliver(() => options.onWorld?.(selfId, {
        k: 'ev',
        h: controllerId,
        kind: message.kind,
        id: message.id,
        hp: message.hp,
        r: message.r,
        i: message.i
      }));
      return;
    }
    if (message.t === 'warp') {
      controllerId = String(message.h || controllerId);
      deliver(() => options.onWorld?.(selfId, {
        k: 'warp',
        h: controllerId,
        w: Number(message.w) || 0,
        warp: Number(message.warp) || 1
      }));
      return;
    }
    if (message.t === 'pong' && Number.isFinite(Number(message.ts))) {
      const rtt = Math.max(0, Date.now() - Number(message.ts));
      options.onLatency?.(rtt);
      return;
    }
    if (message.t === 'error') {
      const error = new Error(String(message.message || 'Server multiplayer error'));
      if (!joined) fail(error);
      else options.onJoinError?.({ fatal: false, mode: 'server', error: error.message });
    }
  };

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({
      t: 'join',
      name: initial.n || options.playerName || '',
      rocketId: initial.r || 'nsx-vanguard',
      roomCode
    }));
    pingTimer = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ t: 'ping', ts: Date.now() }));
      }
    }, PING_INTERVAL_MS);
  });

  ws.addEventListener('message', event => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    handleMessage(message);
  });

  ws.addEventListener('error', () => {
    if (!joined) fail(new Error('Tidak dapat terhubung ke server multiplayer.'));
  });

  ws.addEventListener('close', () => {
    if (!joined) {
      fail(new Error('Koneksi server ditutup sebelum bergabung.'));
      return;
    }
    fail(new Error('Koneksi ke server multiplayer terputus.'));
  });

  joinTimer = setTimeout(() => {
    if (!joined) fail(new Error('Server multiplayer tidak merespons.'));
  }, JOIN_TIMEOUT_MS);

  return ready;
}
