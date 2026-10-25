import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import WebSocket from 'ws';
import { startServer } from '../index.js';

function makeClient(ws) {
  const queue = [];
  const waiters = [];
  ws.on('message', raw => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }
    const index = waiters.findIndex(waiter => waiter.predicate(message));
    if (index >= 0) {
      const [waiter] = waiters.splice(index, 1);
      clearTimeout(waiter.timer);
      waiter.resolve(message);
      return;
    }
    queue.push(message);
  });
  return {
    ws,
    next(predicate = () => true, timeout = 3000) {
      const index = queue.findIndex(predicate);
      if (index >= 0) return Promise.resolve(queue.splice(index, 1)[0]);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const waiterIndex = waiters.findIndex(waiter => waiter.timer === timer);
          if (waiterIndex >= 0) waiters.splice(waiterIndex, 1);
          reject(new Error('Timed out waiting for WebSocket message'));
        }, timeout);
        waiters.push({ predicate, resolve, reject, timer });
      });
    }
  };
}

async function connect(url, origin) {
  const ws = new WebSocket(url, origin ? { headers: { Origin: origin } } : {});
  await once(ws, 'open');
  return makeClient(ws);
}

async function join(client, name, roomCode) {
  client.ws.send(JSON.stringify({
    t: 'join',
    name,
    rocketId: 'nsx-vanguard',
    roomCode
  }));
  return client.next(message => message.t === 'welcome');
}

test('HTTP config and health endpoints are available', async () => {
  const instance = await startServer({
    port: 0,
    host: '127.0.0.1',
    publicOrigins: ['http://test.local']
  });
  const { port } = instance.address;
  try {
    const config = await fetch(`http://127.0.0.1:${port}/api/config`).then(response => response.json());
    assert.deepEqual(config, { mode: 'server', protocol: 1, wsUrl: '/ws', maxPlayers: 16 });
    const health = await fetch(`http://127.0.0.1:${port}/health`).then(response => response.json());
    assert.equal(health.ok, true);
    assert.equal(health.mode, 'server');
  } finally {
    await instance.close();
  }
});

test('static server serves the game and blocks path traversal', async () => {
  const instance = await startServer({
    port: 0,
    host: '127.0.0.1',
    serveStatic: true,
    publicOrigins: ['http://test.local']
  });
  const { port } = instance.address;
  try {
    const root = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(root.status, 200);
    assert.match(await root.text(), /Nusantara Space Explorer/);

    const asset = await fetch(`http://127.0.0.1:${port}/js/net.js`);
    assert.equal(asset.status, 200);
    assert.match(await asset.text(), /detectTransport/);

    const traversal = await fetch(`http://127.0.0.1:${port}/js/%2e%2e/server/index.js`);
    assert.ok([403, 404].includes(traversal.status));

    const packageFile = await fetch(`http://127.0.0.1:${port}/server/package.json`);
    assert.equal(packageFile.status, 404);
  } finally {
    await instance.close();
  }
});

test('origin verification rejects unknown origins', async () => {
  const instance = await startServer({
    port: 0,
    host: '127.0.0.1',
    publicOrigins: ['http://allowed.local']
  });
  const { port } = instance.address;
  try {
    const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`, {
      headers: { Origin: 'http://blocked.local' }
    });
    await assert.rejects(once(ws, 'open'), /403|Unexpected server response/);
  } finally {
    await instance.close();
  }
});

test('two clients share authoritative room state', async () => {
  const instance = await startServer({
    port: 0,
    host: '127.0.0.1',
    publicOrigins: ['http://test.local']
  });
  const { port } = instance.address;
  const url = `ws://127.0.0.1:${port}/ws`;
  let a;
  let b;
  try {
    a = await connect(url, 'http://test.local');
    const welcomeA = await join(a, 'Alpha', 'TEST1');
    assert.equal(welcomeA.protocol, 1);
    assert.equal(welcomeA.room.code, 'test1');
    assert.equal(welcomeA.controllerId, welcomeA.selfId);
    assert.ok(Number(welcomeA.snapshot.ents.bumi.hp) > 1);

    b = await connect(url, 'http://test.local');
    const welcomeB = await join(b, 'Beta', 'TEST1');
    assert.equal(welcomeB.controllerId, welcomeA.selfId);
    assert.ok(welcomeB.players.some(player => player.id === welcomeA.selfId));
    const peerJoin = await a.next(message => message.t === 'peer' && message.action === 'join');
    assert.equal(peerJoin.player.id, welcomeB.selfId);

    b.ws.send(JSON.stringify({ t: 'state', p: [1.234, -2.346, 3.456], y: 0.5, pi: 0.25, v: 12 }));
    const state = await a.next(message => message.t === 'state' && message.id === welcomeB.selfId);
    assert.deepEqual(state.data.p, [1.23, -2.35, 3.46]);
    assert.equal(state.data.y, 0.5);
    assert.equal(state.data.v, 12);

    const initialHp = Number(welcomeA.snapshot.ents.bumi.hp);
    b.ws.send(JSON.stringify({ t: 'hit', kind: 'entity', id: 'bumi' }));
    const hitA = await a.next(message => message.t === 'event' && message.kind === 'hit' && message.id === 'bumi');
    const hitB = await b.next(message => message.t === 'event' && message.kind === 'hit' && message.id === 'bumi');
    assert.equal(hitA.hp, initialHp - 1);
    assert.equal(hitB.hp, initialHp - 1);

    b.ws.send(JSON.stringify({ t: 'warp', warp: 10 }));
    const denied = await b.next(message => message.t === 'error');
    assert.equal(denied.code, 'not_controller');

    a.ws.send(JSON.stringify({ t: 'warp', warp: 10 }));
    const warp = await b.next(message => message.t === 'warp');
    assert.equal(warp.warp, 10);
    assert.equal(warp.h, welcomeA.selfId);

    await new Promise(resolve => setTimeout(resolve, 130));
    b.ws.send(JSON.stringify({ t: 'hit', kind: 'asteroid', i: 0 }));
    const asteroid = await a.next(message => message.t === 'event' && message.kind === 'destroy' && message.i === 0);
    assert.equal(asteroid.i, 0);
  } finally {
    a?.ws.close();
    b?.ws.close();
    await instance.close();
  }
});

test('malformed payloads do not crash the server', async () => {
  const instance = await startServer({
    port: 0,
    host: '127.0.0.1',
    publicOrigins: ['http://test.local']
  });
  const { port } = instance.address;
  const url = `ws://127.0.0.1:${port}/ws`;
  let a;
  let bad;
  try {
    a = await connect(url, 'http://test.local');
    await join(a, 'Alpha', 'SAFE');

    bad = await connect(url, 'http://test.local');
    bad.ws.send(JSON.stringify({ t: 'join', name: { toString: 5 }, roomCode: 'SAFE' }));
    const identityError = await bad.next(message => message.t === 'error');
    assert.equal(identityError.code, 'invalid_identity');

    a.ws.send(JSON.stringify({ t: 'state', p: [{ toString: 5 }, 0, 0], y: 0, pi: 0, v: 0 }));
    const messageError = await a.next(message => message.t === 'error');
    assert.equal(messageError.code, 'bad_message');

    const config = await fetch(`http://127.0.0.1:${port}/api/config`).then(response => response.json());
    assert.equal(config.mode, 'server');
  } finally {
    a?.ws.close();
    bad?.ws.close();
    await instance.close();
  }
});

test('room capacity is enforced', async () => {
  const instance = await startServer({
    port: 0,
    host: '127.0.0.1',
    maxPlayers: 1,
    publicOrigins: ['http://test.local']
  });
  const { port } = instance.address;
  const url = `ws://127.0.0.1:${port}/ws`;
  let a;
  let b;
  try {
    a = await connect(url, 'http://test.local');
    await join(a, 'Alpha', 'FULL');
    b = await connect(url, 'http://test.local');
    b.ws.send(JSON.stringify({ t: 'join', name: 'Beta', rocketId: 'nsx-vanguard', roomCode: 'FULL' }));
    const error = await b.next(message => message.t === 'error');
    assert.equal(error.code, 'room_full');
  } finally {
    a?.ws.close();
    b?.ws.close();
    await instance.close();
  }
});
