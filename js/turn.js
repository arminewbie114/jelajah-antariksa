export const TURN_ENDPOINT = '';

const FETCH_TIMEOUT_MS = 3500;
const MAX_ICE_ENTRIES = 8;

function configuredEndpoint() {
  const runtime = typeof globalThis !== 'undefined' ? globalThis.NSE_TURN_ENDPOINT : '';
  return String(runtime || TURN_ENDPOINT || '').trim();
}

function cleanTurnUrl(value) {
  const url = String(value || '').trim();
  if (!url || url.length > 512) return '';
  if (!/^turns?:\S+$/i.test(url)) return '';
  if (/:53(?:\?|$)/.test(url)) return '';
  return url;
}

function cleanIceServer(server) {
  if (!server || typeof server !== 'object') return null;
  const username = typeof server.username === 'string' ? server.username.trim() : '';
  const credential = typeof server.credential === 'string' ? server.credential.trim() : '';
  if (!username || !credential || username.length > 1024 || credential.length > 1024) return null;
  const rawUrls = Array.isArray(server.urls) ? server.urls : [server.urls];
  const urls = [...new Set(rawUrls.map(cleanTurnUrl).filter(Boolean))].slice(0, 12);
  if (!urls.length) return null;
  const entry = { urls: urls.length === 1 ? urls[0] : urls, username, credential };
  if (server.credentialType === 'password') entry.credentialType = 'password';
  return entry;
}

export function sanitizeTurnServers(value) {
  if (!Array.isArray(value)) return [];
  const result = [];
  const seen = new Set();
  for (const server of value.slice(0, MAX_ICE_ENTRIES)) {
    const entry = cleanIceServer(server);
    if (!entry) continue;
    const fingerprint = `${entry.username}\n${[].concat(entry.urls).join('\n')}`;
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    result.push(entry);
  }
  return result;
}

export async function fetchTurnIceServers({ timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  const endpoint = configuredEndpoint();
  if (!endpoint) return { iceServers: [], source: 'none' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.max(500, Number(timeoutMs) || FETCH_TIMEOUT_MS));
  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = typeof data?.error === 'string' ? `: ${data.error}` : '';
      throw new Error(`HTTP ${response.status}${message}`);
    }
    const raw = Array.isArray(data) ? data : data?.iceServers;
    const iceServers = sanitizeTurnServers(raw);
    if (!iceServers.length) throw new Error('Relay TURN kosong');
    return { iceServers, source: 'worker' };
  } catch (error) {
    const message = error?.name === 'AbortError' ? 'timeout' : String(error?.message || error);
    console.warn('[turn] relay tidak tersedia:', message);
    return { iceServers: [], source: 'error', error: message };
  } finally {
    clearTimeout(timer);
  }
}
