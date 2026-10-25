# AGENTS.md — Aturan Proyek Nusantara Space Explorer

## ATURAN WAJIB (diminta pemilik proyek)
1. **Setelah SETIAP selesai update perbaikan/fitur, WAJIB langsung commit dan push ke GitHub.**
   - Remote: `https://github.com/arminewbie114/jelajah-antariksa.git` (branch `main`).
   - Lakukan `git status` → `git add -A` → commit dengan pesan jelas → push.
   - Jangan menunggu diminta.
2. **JANGAN pernah menyimpan token GitHub** di `.git/config`, script, file, atau commit.
   - Remote harus tetap URL bersih tanpa token.
   - Untuk push, gunakan token sekali pakai, contoh:
     `git -c credential.helper= push https://<TOKEN>@github.com/arminewbie114/jelajah-antariksa.git main`
   - Setelah push, pastikan `git remote -v` tidak mengandung token.
3. Identitas commit repo (lokal, bukan global): gunakan `git config user.name` / `user.email` yang sudah diset di repo ini.

## Ringkasan proyek
Web 3D FPS penjelajah antariksa berbahasa Indonesia (Three.js 0.160 via CDN + importmap, tanpa build tool).
- `index.html` — splash, HUD, panel info, peta, kontrol mobile.
- `js/dataPlanets.js` — data NASA planet, eksoplanet, Bima Sakti (MILKYWAY), galaksi lain (GALAXIES), pesawat NSX.
- `js/main.js` — scene, orbit deterministik, pesawat bersayap, kontrol FPS/touch, autopilot, minimap, audio, remote player, host/controller dunia.
- `js/net.js` — deteksi `GET /api/config` dan pemilihan transport server/P2P.
- `js/net-utils.js` — sumber tunggal `ASTEROID_COUNT=3000`, protocol version, sanitasi nama/room.
- `js/multiplayer.js` — adapter Trystero P2P, presence + kanal world.
- `js/multiplayer-server.js` — adapter WebSocket server.
- `server/` — backend Node `ws` otoritatif, room/world, test.
- `deploy/` — Caddyfile, systemd, env, installer native Ubuntu.
- `css/style.css` — styling.

## Menjalankan & verifikasi
- Serve via HTTP (jangan `file://`): `python3 -m http.server 8080 --bind 0.0.0.0`
- Cek server: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/index.html`
- Cek sintaks (Node Windows, dari folder repo):
  `/mnt/c/nvm4w/nodejs/node.exe --check js/main.js && /mnt/c/nvm4w/nodejs/node.exe --check js/net.js && /mnt/c/nvm4w/nodejs/node.exe --check js/net-utils.js && /mnt/c/nvm4w/nodejs/node.exe --check js/multiplayer-server.js`
- Test backend (Node/npm lewat Windows `cmd.exe`; WSL tidak punya `node`):
  `cmd.exe /c "cd /d C:\Users\USER\Desktop\nusantara-space-explorer\server && npm test"`
- Mode server lokal: `SERVE_STATIC=1 npm start` dari `server/`, buka `http://127.0.0.1:8787`.
- Deteksi/health: `curl -fsS http://127.0.0.1:8787/api/config` dan `/health`.

## Batasan desain yang harus dijaga
- Skala semi-realistis playable; pesawat `SHIP_SCALE=0.15` (lebih besar dari Bulan di game).
- Kecepatan tampilan HUD dinormalisasi: `WORLD_MAX=650` → `SPEED_MAX=4000 km/dtk`. Default tanpa boost = **50 km/dtk** (world 8,125); boost 800; warp penuh 4000.
- Kamera hanya **Free-Fly FPS** (chase di belakang-atas); tidak ada mode kokpit atau tombol `C`.
- Pesawat futuristik **bersayap** (bukan roket), **dominan putih** dengan aksen menyala: Vanguard (delta), Odyssey (sayap lebar/katamaran), Aurora (forward-swept + panel emas), Garuda (Airbus A330-300, livery putih-biru Garuda Indonesia, ekor burung Garuda).
- Mobile: dua stik analog — kiri gerak (atas maju, bawah mundur, kiri/kanan strafe), kanan mengarahkan (atas/bawah pitch, kiri/kanan yaw).
- Autopilot/ikuti: tanpa batas kecepatan maksimum; offline warp waktu dikunci 1×, di multiplayer mengikuti warp global host. Parkir di sisi siang planet, tombol `E` toggle panel.
- Laser: hitscan `F`/klik kiri/tombol mobile ⚡, cooldown 0,17 dtk, tanpa amunisi; asteroid 1 HP, planet beberapa HP, objek raksasa 60–500 HP (semua di `hp` data). Respawn 60 dtk (`RESPAWN_MS`), asteroid permanen per sesi.
- Eksoplanet: periode orbit asli di data, visual orbit diperlambat 15× (`lambat:15`).
- Objek Bima Sakti & galaksi: posisi statis (`fixed:true`), punya `nearRadius`, `hoverRadius`, `arriveRadius`, dan `info`; autopilot parkir di `hoverRadius`, batas dunia 2000 unit.
- Daftar autopilot dikelompokkan: Tata Surya / Eksoplanet / Bima Sakti / Galaksi Lain.

## Arsitektur multiplayer dua mode
- Frontend memanggil `GET /api/config` lewat `js/net.js`. Respons `{mode:'server',protocol:1}` → WebSocket server; 404/gagal → P2P. Jangan memakai user-agent atau query string untuk memilih mode.
- **Server mode**: VPS Ubuntu native, Node 20+/22, Caddy, systemd. Hanya TCP `80/443`; **jangan** tambahkan Docker, coturn, TURN, atau UDP di VPS. Caddy menyajikan `/opt/nse` dan mem-proxy `/api/*`, `/health`, `/ws` ke `127.0.0.1:8787`; backend berada di `/opt/nse-backend` (di luar web root).
- Server otoritatif untuk room/presence, HP, destroy, respawn, asteroid bitset, jam dunia, dan controller warp. Posisi kapal dilaporkan client dan divalidasi batas; bukan anti-cheat fisika penuh.
- Protokol client: `join`, `state`, `hit`, `warp`, `ping`; server: `welcome`, `world`, `peer`, `state`, `event`, `warp`, `pong`, `error`. Snapshot dunia 5 Hz; state pemain 10 Hz.
- Pemain pertama menjadi controller. Jika controller keluar, server mempromosikan pemain berikutnya dan mengirim snapshot/warp baru. Di server mode jangan jalankan host election P2P, `hello`/`claim`, broadcast snapshot client, atau ping host.
- `MAX_PLAYERS` default 16 (belum diuji lebih besar); `MAX_ROOMS`, `ROOM_IDLE_MS`, `PUBLIC_ORIGIN`/`ALLOWED_ORIGINS` diatur lewat `/etc/nse/nse.env`.
- Origin WebSocket diverifikasi terhadap `PUBLIC_ORIGIN`/`ALLOWED_ORIGINS`. Jangan longgarkan tanpa alasan; jangan bind Node ke `0.0.0.0` di produksi.
- Data dunia in-memory; restart server mereset room dan HP/asteroid. Belum ada akun, database, chat, atau PvP.
- Deploy/update: `sudo ./deploy/install.sh <domain>`; script mengganti `/etc/caddy/Caddyfile` dan menyimpan backup. Panduan di `deploy/README.md`.
- GitHub Pages dan VPS memakai **pool ruangan terpisah**. Jangan menyatukan room ID atau mengarahkan P2P ke server tanpa diminta.

## Multiplayer P2P (Trystero, GitHub Pages)
- Nama pilot **wajib** 2–16 karakter sebelum launch; kode ruangan opsional (minimal 3 karakter, huruf/angka/tanda hubung). Nama/room disimpan di `localStorage`.
- Room publik `nusantara-public-v1`; room privat `nusantara-room-v1-${code}` + password `nse-room:${code}`; `appId` `nusantara-space-explorer-v1`.
- CDN dipin: `https://cdn.jsdelivr.net/npm/trystero@0.26.0/+esm` (default Nostr). Import dilakukan dinamis agar launch tidak diblokir dan tetap bisa offline.
- State presence (`ship`) berisi nama, `rocketId`, posisi, yaw, pitch, speed; kirim ±10 Hz dan target langsung saat peer join.
- Kanal `world` menyinkronkan kondisi dunia: snapshot host `{k:'snap',h,w,warp,seq,ents,ast}` ±5 Hz, event `hit`/`destroy`/`respawn`, `claim`, `hello`, `ping`/`pong`.
- **Host dunia** adalah otoritas P2P untuk HP, destroy, respawn, asteroid bitset, dan warp global. Host aktif dipertahankan; saat bentrok, host dengan `seq` snapshot lebih tinggi menang (lebih lama memegang dunia), jika sama ID terendah menang. Semua pihak harus konvergen ke satu host.
- Orbit seluruh objek memakai waktu dunia deterministik `worldTime`/`currentWorldTime`; base angle dan asteroid field memakai seed tetap. Jangan memakai `Math.random()` untuk posisi/rotasi asteroid atau sudut awal orbit.
- Host mengatur warp `1×/10×/100×`; tombol warp non-host disabled. Saat host mengganti warp, reset anchor clock (`clockBase`/`clockAt`) agar tidak ada lompatan retroaktif.
- Saat host menjadi host, clock host harus mengikuti `currentWorldTime()`; jangan mengakumulasi `worldTime` dengan `dt` ter-clamp karena FPS rendah/background membuat host dan client drift.
- Semua entity (`entities`) + 3000 asteroid ikut state; asteroid yang hancur permanen per sesi, entity respawn 60 dtk (`RESPAWN_MS`). Respawn hanya dijalankan host; client menerima event/snapshot.
- Host migration: host timeout ±3,5 dtk; host baru melanjutkan clock/state terakhir. `S.visited` tetap personal, jangan disinkronkan.
- Remote player tetap visual: jangan menambahkan PvP/chat tanpa diminta, dan jangan membuat `PointLight` engine untuk remote (performa). Damage ke objek dunia tetap boleh karena host-authoritative.
- Sanitasi semua input peer: nama, `rocketId` (harus ada di `builders`), posisi finite ±2600, pitch ±1.5; snapshot/ID/index divalidasi sebelum diterapkan.
- Saat dispose remote ship jangan dispose texture builder yang di-cache (Garuda); cukup geometry/material dan texture name tag milik sprite remote.
- `addRocketLights(target, withEngineLight)` harus tetap mendukung target model remote; nama grup `navLights`, `flame`, `engineHalo`, `strobe`, `engineLight` dipertahankan.
- Koneksi memakai **STUN + TURN otomatis**: `js/turn.js` mengambil `iceServers` TURN sementara dari Cloudflare Worker (`worker/`), lalu diteruskan ke Trystero lewat `startMultiplayer({turnConfig})`; default STUN Trystero tetap dipakai. Tidak ada UI input TURN untuk pemain.
- TURN key Cloudflare **hanya** boleh disimpan sebagai secret Worker (`TURN_KEY_ID`, `TURN_KEY_API_TOKEN`) atau secret deploy; jangan pernah commit ke repo, frontend, atau log. Worker membatasi origin, memfilter URL port 53, dan meng-cache kredensial maksimal 5 menit.
- `TURN_ENDPOINT` di `js/turn.js` harus diisi URL Worker + `/api/turn` setelah Worker dideploy. Tanpa endpoint/relay yang valid, game harus tetap fallback ke STUN/direct dan tidak crash.
- NAT ketat/firewall yang memblokir WebRTC bisa tetap gagal walau TURN aktif. Jangan menambahkan input TURN manual tanpa diminta; perbaiki relay lewat Worker.
- Keterbatasan P2P: tanpa server anti-cheat, kode room bukan keamanan kuat, dan koneksi publik bisa flaky. Server VPS adalah mode terpisah dengan otoritas server.
- Jangan mengaktifkan TURN/coturn di VPS server mode; TURN hanya untuk P2P GitHub Pages. Server mode tidak boleh memanggil `fetchTurnIceServers()`.
- `ASTEROID_COUNT` hanya didefinisikan di `js/net-utils.js`; frontend dan server harus mengimpor nilai yang sama.
- Jangan `await` koneksi Trystero sebelum splash ditutup/pointer lock agar gesture audio tetap valid; mulai koneksi async setelah launch.
