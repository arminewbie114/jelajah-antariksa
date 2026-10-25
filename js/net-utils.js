export const ASTEROID_COUNT = 3000;
export const NET_PROTOCOL_VERSION = 1;

export function sanitizePilotName(raw){
  const text=(typeof raw==='string'?raw:'').slice(0,64).normalize('NFKC')
    .replace(/[^\p{L}\p{N} _.-]/gu,'')
    .replace(/\s+/g,' ')
    .trim();
  return Array.from(text).slice(0,16).join('');
}

export function normalizeRoomCode(raw){
  return (typeof raw==='string'?raw:'').normalize('NFKC').toLowerCase()
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .slice(0,24);
}
