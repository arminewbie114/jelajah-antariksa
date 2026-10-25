const DEFAULT_ALLOWED_ORIGINS = 'https://arminewbie114.github.io,http://localhost:8080,http://127.0.0.1:8080';
const TURN_API_BASE = 'https://rtc.live.cloudflare.com/v1/turn/keys';
const CACHE_ORIGIN = 'https://nse-turn.internal';

function normalizeOrigins(value) {
  return String(value || DEFAULT_ALLOWED_ORIGINS)
    .split(',')
    .map(origin => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

function getAllowedOrigin(request, env) {
  const origin = String(request.headers.get('Origin') || '').replace(/\/+$/, '');
  if (!origin) return '';
  return normalizeOrigins(env.ALLOWED_ORIGINS).includes(origin) ? origin : '';
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Accept, Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function jsonResponse(body, status, origin, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders
  };
  if (origin) Object.assign(headers, corsHeaders(origin));
  return new Response(JSON.stringify(body), { status, headers });
}

function turnTtl(env) {
  const value = Number.parseInt(env.TURN_TTL || '14400', 10);
  return Number.isFinite(value) ? Math.min(86400, Math.max(60, value)) : 14400;
}

function sanitizeTurnUrl(value) {
  const url = String(value || '').trim();
  if (!url || url.length > 512) return '';
  if (!/^turns?:\S+$/i.test(url)) return '';
  if (/:53(?:\?|$)/.test(url)) return '';
  return url;
}

export function sanitizeIceServers(value) {
  if (!Array.isArray(value)) return [];
  const output = [];
  const seen = new Set();
  for (const item of value.slice(0, 8)) {
    if (!item || typeof item !== 'object') continue;
    const username = typeof item.username === 'string' ? item.username.trim() : '';
    const credential = typeof item.credential === 'string' ? item.credential.trim() : '';
    if (!username || !credential || username.length > 1024 || credential.length > 1024) continue;
    const rawUrls = Array.isArray(item.urls) ? item.urls : [item.urls];
    const urls = [...new Set(rawUrls.map(sanitizeTurnUrl).filter(Boolean))].slice(0, 12);
    if (!urls.length) continue;
    const fingerprint = `${username}\n${urls.join('\n')}`;
    if (seen.has(fingerprint)) continue;
    seen.add(fingerprint);
    const entry = { urls: urls.length === 1 ? urls[0] : urls, username, credential };
    if (item.credentialType === 'password') entry.credentialType = 'password';
    output.push(entry);
  }
  return output;
}

function cacheKey(keyId, ttl) {
  return new Request(`${CACHE_ORIGIN}/ice/${encodeURIComponent(keyId)}/${ttl}`, { method: 'GET' });
}

async function readCache(key) {
  if (typeof caches === 'undefined' || !caches?.default) return null;
  try {
    const response = await caches.default.match(key);
    return response ? await response.json() : null;
  } catch {
    return null;
  }
}

async function writeCache(key, result, seconds) {
  if (typeof caches === 'undefined' || !caches?.default) return;
  try {
    const response = new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${seconds}`
      }
    });
    await caches.default.put(key, response);
  } catch {}
}

export async function getIceServers(env) {
  const keyId = String(env.TURN_KEY_ID || '').trim();
  const token = String(env.TURN_KEY_API_TOKEN || '').trim();
  if (!keyId || !token) {
    const error = new Error('TURN belum dikonfigurasi');
    error.status = 503;
    throw error;
  }

  const ttl = turnTtl(env);
  const key = cacheKey(keyId, ttl);
  const cached = await readCache(key);
  if (cached && Array.isArray(cached.iceServers) && cached.expiresAt > Date.now() + 60000) {
    return cached;
  }

  let upstream;
  try {
    upstream = await fetch(`${TURN_API_BASE}/${encodeURIComponent(keyId)}/credentials/generate-ice-servers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ttl }),
      cache: 'no-store'
    });
  } catch {
    const error = new Error('TURN upstream tidak dapat dihubungi');
    error.status = 502;
    throw error;
  }

  if (!upstream.ok) {
    const error = new Error(`TURN upstream HTTP ${upstream.status}`);
    error.status = 502;
    throw error;
  }

  const data = await upstream.json().catch(() => null);
  const iceServers = sanitizeIceServers(data?.iceServers);
  if (!iceServers.length) {
    const error = new Error('TURN upstream tidak mengembalikan relay');
    error.status = 502;
    throw error;
  }

  const result = { iceServers, ttl, expiresAt: Date.now() + ttl * 1000 };
  const cacheSeconds = Math.min(300, Math.max(15, Math.floor(ttl / 4)));
  await writeCache(key, result, cacheSeconds);
  return result;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = getAllowedOrigin(request, env);

    if (url.pathname === '/health') {
      return jsonResponse({
        ok: true,
        configured: Boolean(String(env.TURN_KEY_ID || '').trim() && String(env.TURN_KEY_API_TOKEN || '').trim())
      }, 200, origin, { 'Cache-Control': 'no-store' });
    }

    if (url.pathname !== '/api/turn') {
      return jsonResponse({ error: 'Not found' }, 404, origin, { 'Cache-Control': 'no-store' });
    }

    if (request.method === 'OPTIONS') {
      if (!origin) return new Response(null, { status: 403, headers: { 'X-Content-Type-Options': 'nosniff' } });
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405, origin, {
        'Allow': 'GET, OPTIONS',
        'Cache-Control': 'no-store'
      });
    }

    if (!origin) {
      return jsonResponse({ error: 'Origin tidak diizinkan' }, 403, '', { 'Cache-Control': 'no-store' });
    }

    try {
      const result = await getIceServers(env);
      const maxAge = Math.min(300, Math.max(15, Math.floor(turnTtl(env) / 4)));
      return jsonResponse({ iceServers: result.iceServers, ttl: result.ttl }, 200, origin, {
        'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=60`
      });
    } catch (error) {
      const status = Number(error?.status) || 500;
      if (status >= 500) console.error(`[nse-turn] ${error?.message || 'unknown error'}`);
      return jsonResponse({ error: status === 503 ? 'TURN belum dikonfigurasi' : 'Relay TURN tidak tersedia' }, status, origin, {
        'Cache-Control': 'no-store'
      });
    }
  }
};
