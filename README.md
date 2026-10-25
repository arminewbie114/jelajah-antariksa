# 🚀 Nusantara Space Explorer

Web penjelajah antariksa 3D FPS berbahasa Indonesia. Terbangkan pesawat futuristik (NSX Vanguard, Odyssey, Aurora, Garuda A330) ke **8 planet + Bulan + Pluto + 3 eksoplanet nyata**, lalu jelajahi **Bima Sakti** (Sgr A*, Nebula Orion, Pleiades, Sirius, Alpha Centauri, Betelgeuse) dan **5 galaksi lain** (Andromeda, Triangulum, LMC, Whirlpool, Sombrero).

Multiplayer tersedia dalam dua mode terpisah:

| Mode | Hosting | Otoritas dunia | Transport |
|---|---|---|---|
| **Server** | VPS Ubuntu + Caddy + Node | Server WebSocket | TCP 443, tanpa TURN |
| **P2P** | GitHub Pages / hosting statis | Host P2P | Trystero WebRTC + Cloudflare TURN |

Frontend mendeteksi mode lewat `GET /api/config`. Di VPS endpoint itu mengembalikan `mode: "server"`; di GitHub Pages 404 sehingga game otomatis memakai P2P. **Ruangan kedua mode tidak saling terhubung.**

## Cara menjalankan

### Mode P2P statis

```bash
python3 -m http.server 8080 --bind 0.0.0.0
# buka http://localhost:8080
```

Atau gunakan Live Server VS Code. Mode ini membutuhkan internet untuk CDN Three.js dan Trystero.

### Mode server lokal

```bash
cd server
npm install
SERVE_STATIC=1 npm start
# buka http://127.0.0.1:8787
```

Windows PowerShell:

```powershell
cd server
npm install
$env:SERVE_STATIC="1"; npm start
```

`SERVE_STATIC=1` hanya untuk pengembangan. Di produksi, Caddy yang menyajikan file statis dan mem-proxy `/api/*`, `/health`, serta `/ws` ke Node.

### Deploy VPS

Panduan lengkap: [`deploy/README.md`](deploy/README.md).

```bash
sudo ./deploy/install.sh nse.example.com
```

Target: Ubuntu 22.04/24.04, Node 20+, Caddy 2, systemd. Hanya port TCP `80/443` yang perlu dibuka; tidak ada Docker, coturn, TURN, atau UDP.

## Multiplayer server

- Nama pilot wajib 2–16 karakter. Kode ruangan opsional (minimal 3 karakter bila diisi); kode yang sama menempatkan pemain di ruangan yang sama.
- Server memegang otoritas **ruangan, presence, HP, kehancuran, respawn, asteroid, jam dunia, dan controller warp**.
- Posisi kapal dikirim client ±10×/detik dan divalidasi batasnya oleh server. Ini bukan anti-cheat fisika penuh.
- Snapshot dunia dikirim server ±5×/detik. Pemain pertama menjadi **controller**; jika keluar, pemain berikutnya dipromosikan.
- Controller mengatur warp global `1×/10×/100×`. Semua pemain menerima snapshot dan event yang sama.
- Default 16 pemain per ruangan (`MAX_PLAYERS`), belum diuji untuk beban lebih besar.
- Data dunia disimpan di memori; restart server mereset ruangan dan HP/asteroid.
- Kapal pemain lain tetap visual. Belum ada PvP, chat, atau akun.

## Multiplayer P2P (GitHub Pages)

- Tetap memakai Trystero 0.26 (Nostr + WebRTC) dan Cloudflare TURN Worker yang sudah ada.
- Nama pilot wajib; kode ruangan kosong memakai ruang publik `nusantara-public-v1`.
- Host dunia mengirim snapshot, HP, kehancuran, respawn, asteroid, dan warp. Host migration berjalan bila host keluar.
- `js/turn.js` masih berisi `TURN_ENDPOINT = ''`. Isi URL Worker + `/api/turn` setelah Worker dideploy; tanpa itu P2P memakai STUN/direct dan bisa gagal di NAT ketat.
- Worker dan TURN key disiapkan sekali oleh pemilik proyek. Kredensial rahasia tidak boleh masuk repo atau browser.
- P2P tetap bisa offline jika CDN/relay tidak tersedia.

## Kontrol

- **Desktop:** WASD gerak, mouse lihat (klik canvas untuk kunci pointer), **F / klik kiri = laser**, Spasi/Ctrl naik-turun, Shift boost, J warp, E info (toggle), M peta + autopilot, R isi bensin, 1/2/3/4 ganti pesawat.
- **Mobile:** stik kiri = maju/mundur/strafe, stik kanan = arahkan, tombol **⚡** = tembak laser.
- **Autopilot:** pilih tujuan di peta (M). Kapal mendekat, mencocokkan kecepatan, lalu parkir di sisi siang objek. Tekan E untuk info; gerakkan mouse/WASD untuk batal.

## Laser & penghancuran

- Laser hitscan tanpa amunisi, cooldown ±0,17 detik.
- Asteroid hancur dalam 1 tembakan; planet/bulan beberapa tembakan; objek raksasa puluhan–ratusan.
- Semua objek yang hancur kembali otomatis setelah 60 detik, kecuali asteroid yang tetap hilang selama sesi.
- Di server mode, hit dikirim ke server; server menghitung HP, destroy, respawn, dan asteroid. Di P2P, host yang menghitung.

## Yang bisa dijelajahi

- Tata Surya: Merkurius–Neptunus, Pluto, Bulan, Matahari, Cygnus X-1.
- Eksoplanet: Proxima Centauri b, TRAPPIST-1e, Kepler-452b.
- Bima Sakti: bintang, gugus, nebula, dan lubang hitam supermasif Sgr A*.
- Galaksi lain: Andromeda, Triangulum, Awan Magellan Besar, Whirlpool, Sombrero.

## Akurasi data

Diameter, jarak AU, periode orbit, suhu, dan gravitasi planet mengacu NASA Planetary Fact Sheet. Data bintang/galaksi memakai jarak dan ukuran astronomis nyata. Skala render dikompresi agar playable; nilai asli selalu tercantum di panel info.

## Teknologi

- Three.js 0.160 via CDN + importmap, tanpa build tool.
- Node.js + `ws` untuk server WebSocket otoritatif.
- Caddy untuk TLS otomatis, file statis, dan reverse proxy WebSocket.
- Trystero 0.26 + Cloudflare TURN untuk mode P2P GitHub Pages.
- Tekstur prosedural Canvas, WebAudio, minimap 2D, kontrol sentuh dua stik.

## Struktur

```
index.html          — splash, HUD, panel info, peta, kontrol mobile
css/style.css       — tema UI
js/dataPlanets.js   — data NASA + Bima Sakti + galaksi
js/main.js          — scene, orbit, pesawat, FPS/touch, autopilot, minimap, audio, remote player
js/net.js           — deteksi server vs P2P dan pemilihan transport
js/net-utils.js     — ASTEROID_COUNT, protocol version, sanitasi nama/kode ruangan
js/multiplayer.js   — adapter Trystero P2P
js/multiplayer-server.js — adapter WebSocket server
js/turn.js          — kredensial TURN Worker untuk P2P
server/index.js     — HTTP API, /ws, static dev server
server/room.js      — ruangan, presence, controller, snapshot, rate limit
server/world.js     — HP, destroy, respawn, asteroid, validasi state
server/test/        — unit test dan integration test WebSocket
worker/             — Cloudflare Worker kredensial TURN (P2P)
deploy/             — Caddyfile, systemd, env example, installer
```

## Verifikasi

```bash
# Unit + integration test server
cd server
npm test

# Sintaks frontend/backend
node --check js/main.js
node --check js/net.js
node --check js/net-utils.js
node --check js/multiplayer.js
node --check js/multiplayer-server.js
node --check server/index.js
node --check server/room.js
node --check server/world.js

# Deteksi mode server
curl -fsS http://127.0.0.1:8787/api/config
curl -fsS http://127.0.0.1:8787/health
```

Uji browser mode server: buka dua tab, isi nama berbeda dan kode ruangan yang sama. HUD harus `👥 2`, status memuat `· server`, tab pertama `controller`, tab kedua `sinkron controller`. Tutup tab controller dan pastikan tab lain menjadi controller.

Uji P2P: jalankan server statis tanpa `/api/config`, buka dua tab, lalu pastikan status memuat `host dunia` dan `sinkron host`.
