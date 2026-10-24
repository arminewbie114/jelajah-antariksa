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
- `js/dataPlanets.js` — data NASA planet, eksoplanet, pesawat NSX, lubang hitam.
- `js/main.js` — scene, orbit, pesawat bersayap, kontrol FPS/touch, autopilot, minimap, audio.
- `css/style.css` — styling.

## Menjalankan & verifikasi
- Serve via HTTP (jangan `file://`): `python3 -m http.server 8080 --bind 0.0.0.0`
- Cek server: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/index.html`
- Cek sintaks (Node Windows): salin `js/main.js` ke `_check.mjs` lalu
  `/mnt/c/nvm4w/nodejs/node.exe --check _check.mjs` (hapus file setelahnya).

## Batasan desain yang harus dijaga
- Skala semi-realistis playable; pesawat `SHIP_SCALE=0.1` (sebesar Bulan di game).
- Kecepatan tampilan HUD dinormalisasi: `WORLD_MAX=650` → `SPEED_MAX=4000 km/dtk`.
- Pesawat futuristik **bersayap** (bukan roket): Vanguard (delta), Odyssey (sayap lebar/katamaran), Aurora (forward-swept + panel emas).
- Mobile: sensitivitas kamera sentuh `TOUCH_LOOK=0.0016` + smoothing; joystick analog; sentuhan UI tidak memutar kamera.
- Autopilot/ikuti: tanpa batas kecepatan maksimum, warp waktu dikunci 1×, parkir di sisi siang planet, tombol `E` toggle panel.
- Eksoplanet: periode orbit asli di data, visual orbit diperlambat 15× (`lambat:15`).
