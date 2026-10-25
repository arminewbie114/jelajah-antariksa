# NSE TURN Worker

Worker kecil untuk membuat kredensial TURN sementara dari Cloudflare Realtime TURN. TURN key hanya disimpan sebagai secret Worker, tidak pernah masuk repo atau browser.

## 1. Buat TURN key

1. Buka [Cloudflare Calls](https://dash.cloudflare.com/?to=/:account/calls).
2. Buat **TURN key** baru, misalnya `nusantara-space-explorer`.
3. Simpan **TURN Key ID** dan **TURN Key API Token** (token hanya ditampilkan sekali).

Cloudflare Realtime memberi kuota **1 TB egress/bulan**; lewat dari itu biayanya $0.05/GB. Pantau usage di dashboard Cloudflare.

## 2. Deploy Worker

### Opsi dashboard

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Worker**.
2. Nama: `nse-turn`.
3. Paste isi `worker/src/index.js`.
4. Tambahkan environment variables:
   - `TURN_KEY_ID` = TURN Key ID
   - `TURN_KEY_API_TOKEN` = TURN Key API Token (secret)
   - `ALLOWED_ORIGINS` = `https://arminewbie114.github.io,http://localhost:8080,http://127.0.0.1:8080`
   - `TURN_TTL` = `14400`
5. Deploy. URL menjadi `https://nse-turn.<subdomain>.workers.dev`.

### Opsi Wrangler

```bash
cd worker
npx wrangler@4 deploy
npx wrangler@4 secret put TURN_KEY_ID
npx wrangler@4 secret put TURN_KEY_API_TOKEN
```

`ALLOWED_ORIGINS` dan `TURN_TTL` ada di `wrangler.toml`. Tambahkan domain game lain ke `ALLOWED_ORIGINS` bila perlu. Untuk lokal, buat `worker/.dev.vars` (jangan commit) berisi secret yang sama.

## 3. Hubungkan game

Isi `TURN_ENDPOINT` di `js/turn.js` dengan URL Worker + `/api/turn`, contoh:

```js
export const TURN_ENDPOINT = 'https://nse-turn.<subdomain>.workers.dev/api/turn';
```

Commit dan push. Pemain tidak perlu mengisi apa pun.

## 4. Verifikasi

```bash
curl https://nse-turn.<subdomain>.workers.dev/health
curl -H "Origin: https://arminewbie114.github.io" https://nse-turn.<subdomain>.workers.dev/api/turn
```

Respons `/api/turn` harus berisi `iceServers` dengan URL `turn:`/`turns:` dan `username`/`credential`. Jangan bagikan respons ini ke publik.

## Catatan keamanan

- **Jangan hardcode TURN Key API Token** di frontend atau repo.
- `ALLOWED_ORIGINS` membatasi pemanggilan dari browser, tetapi bukan autentikasi kuat. Aktifkan rate limiting/WAF di Cloudflare bila endpoint dipublikasikan luas.
- Kredensial TURN dibuat pendek (`TURN_TTL`, default 4 jam) dan di-cache Worker maksimal 5 menit.
- Jika ingin menghentikan relay, hapus/revoke TURN key di Cloudflare.
