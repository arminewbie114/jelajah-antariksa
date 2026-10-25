import { NET_PROTOCOL_VERSION } from './net-utils.js';
import { fetchTurnIceServers } from './turn.js';

let transportPromise = null;

async function detectTransport() {
  if (typeof fetch !== 'function') return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch('/api/config', {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    if (!response.ok) return null;
    const data = await response.json().catch(() => null);
    if (data?.mode !== 'server') return null;
    if (Number(data.protocol) !== NET_PROTOCOL_VERSION) return null;
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function resolveTransport() {
  if (!transportPromise) transportPromise = detectTransport();
  return transportPromise;
}

export async function startMultiplayer(options = {}) {
  const serverConfig = await resolveTransport();
  if (serverConfig) {
    const { startMultiplayer: startServerMultiplayer } = await import('./multiplayer-server.js');
    return startServerMultiplayer({ ...options, serverConfig });
  }

  const turn = await fetchTurnIceServers();
  if (turn.source === 'error') options.onTurnError?.(turn);
  const { startMultiplayer: startP2PMultiplayer } = await import('./multiplayer.js');
  return startP2PMultiplayer({ ...options, turnConfig: turn.iceServers });
}
