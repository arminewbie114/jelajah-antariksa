# 🚀 Nusantara Space Explorer

Web penjelajah antariksa 3D FPS berbahasa Indonesia. Terbangkan pesawat futuristik (NSX Vanguard, Odyssey, Aurora, Garuda A330) ke **8 planet + Bulan + Pluto + 3 eksoplanet nyata**, lalu jelajahi **Bima Sakti** (Sgr A*, Nebula Orion, Pleiades, Sirius, Alpha Centauri, Betelgeuse) dan **5 galaksi lain** (Andromeda, Triangulum, LMC, Whirlpool, Sombrero). Bisa dimainkan bersama lewat **multiplayer P2P**: isi nama pilot, lalu gunakan ruang publik atau bagikan kode ruangan.

## Cara menjalankan

**Paling mudah (Windows):** buka folder ini lalu double-klik `index.html` — butuh internet untuk CDN Three.js.

**Via server lokal (disarankan):**
```powershell
cd "$env:USERPROFILE\Desktop\nusantara-space-explorer"
python -m http.server 8080
# buka http://localhost:8080
```
Atau pakai ekstensi *Live Server* di VS Code.

## Multiplayer P2P
- **Nama pilot wajib** diisi sebelum meluncur (2–16 karakter). Nama terakhir disimpan di `localStorage`.
- **Kode ruangan kosong** = ruang publik `nusantara-public-v1`. Isi kode yang sama di beberapa perangkat untuk membuat ruang privat, mis. `teman-kecil`.
- Pemain lain tampil sebagai pesawat yang sama pilihannya + name tag. Jumlah pemain ada di HUD (`👥`).
- **Dunia tersinkron:** satu pemain menjadi **host dunia** (ditandai 👑). Host mengirim snapshot posisi orbit, HP, status hancur, dan timer respawn semua planet/bulan/objek Bima Sakti/galaksi ±5×/detik. Asteroid tetap deterministik dan status hancurnya ikut disinkronkan.
- **Warp global:** host mengatur waktu dunia `1× / 10× / 100×`; tombol warp pemain lain dinonaktifkan agar semua orbit tetap sama. Autopilot di multiplayer mengikuti warp host (offline tetap otomatis 1×).
- **Host migration:** jika host keluar, pemain tersisa memilih host baru dan melanjutkan state dunia terakhir. Progres kunjungan `S.visited` tetap **personal** tiap pemain.
- Kapal pemain lain tetap visual (belum ada PvP/chat). Koneksi memakai **Trystero 0.26 (Nostr + WebRTC)** dari CDN, tanpa akun, database, atau server game. State pesawat dikirim ±10×/detik.
- Otoritas dunia dipegang host P2P, bukan server anti-cheat. Koneksi memakai **STUN + relay TURN otomatis**: frontend mengambil kredensial TURN sementara dari Cloudflare Worker, jadi pemain tidak perlu mengisi URL/akun. Jika relay tidak tersedia, koneksi jatuh kembali ke STUN/direct.
- Relay TURN memakai **Cloudflare Realtime TURN** dengan kuota gratis **1 TB egress/bulan**. Worker dan TURN key disiapkan sekali oleh pemilik proyek; kredensial rahasia tidak pernah masuk repo atau browser. Panduan ada di [`worker/README.md`](worker/README.md).
- NAT ketat/simetris, jaringan seluler, atau firewall yang memblokir WebRTC tetap bisa gagal walaupun relay aktif. Jika status tidak bertambah menjadi 2 pemain, coba ulang atau gunakan jaringan lain.
- Jika CDN/relay tidak tersedia, game tetap bisa dimainkan **offline** setelah nama diisi.

## Kontrol
- **Desktop:** WASD gerak, mouse lihat (klik canvas untuk kunci pointer), **F / klik kiri = laser**, Spasi/Ctrl naik-turun, Shift boost, J warp, E info (toggle), M peta + autopilot, R isi bensin, 1/2/3/4 ganti pesawat.
- **Mobile:** stik kiri = maju/mundur/strafe, stik kanan = arahkan (atas/bawah/kiri/kanan), tombol **⚡** = tembak laser (tahan untuk tembak otomatis).
- **Autopilot:** pilih tujuan di peta (M). Kapal otomatis mendekat, mencocokkan kecepatan, lalu parkir di sisi siang objek. Tekan E untuk membuka info; gerakkan mouse/WASD untuk batal.

## Laser & penghancuran
- Laser menembak lurus mengikuti crosshair, tanpa amunisi (cooldown ±0,17 dtk).
- **Asteroid hancur dalam 1 tembakan** dan terurai menjadi pecahan.
- **Planet/bulan** butuh beberapa tembakan; **objek raksasa** (Matahari, bintang, nebula, galaksi, lubang hitam) butuh puluhan–ratusan tembakan.
- Setiap objek punya HP di `js/dataPlanets.js`; HP target tampil di bawah crosshair dan di panel info.
- Semua objek yang hancur **kembali otomatis setelah 60 detik** (asteroid tidak respawn). Di multiplayer, HP, kehancuran, dan respawn disinkronkan oleh host; asteroid yang sudah hancur tetap hilang untuk semua pemain selama sesi. Autopilot otomatis batal bila target hancur.

## Yang bisa dijelajahi
- Tata Surya: Merkurius–Neptunus, Pluto, Bulan, Matahari, Cygnus X-1.
- Eksoplanet: Proxima Centauri b, TRAPPIST-1e, Kepler-452b.
- Bima Sakti: bintang, gugus, nebula, dan lubang hitam supermasif Sgr A*.
- Galaksi lain: Andromeda, Triangulum, Awan Magellan Besar, Whirlpool, Sombrero.

## Akurasi data
Diameter, jarak AU, periode orbit, suhu, dan gravitasi planet mengacu NASA Planetary Fact Sheet. Data bintang/galaksi memakai jarak dan ukuran astronomis nyata (tahun cahaya). Skala render dikompresi agar playable: jarak tata surya 1:4000, diameter log, posisi galaksi didekatkan; nilai asli selalu tercantum di panel info.

## Teknologi
- Three.js 0.160 via CDN + importmap, tanpa build tool — siap hosting statis (Vercel/Netlify/GitHub Pages).
- Trystero 0.26 via CDN untuk presence multiplayer P2P (WebRTC, signaling Nostr).
- Tekstur prosedural Canvas (planet, galaksi, nebula) tanpa aset unduhan besar.
- Audio WebAudio, minimap 2D, kontrol sentuh dua stik.

## Struktur
```
index.html       — splash, HUD, panel info, peta, kontrol mobile
css/style.css    — tema UI
js/dataPlanets.js — data NASA + Bima Sakti + galaksi (sumber kebenaran)
js/main.js       — scene, orbit deterministik, pesawat, FPS/touch, autopilot, minimap, audio, remote player, host dunia
js/multiplayer.js — Trystero P2P, sanitasi nama/kode ruangan, presence + kanal world
js/turn.js       — ambil kredensial relay TURN dari Worker, validasi, fallback STUN
worker/          — Cloudflare Worker pembuat kredensial TURN sementara (secret tidak masuk repo)
```

## Verifikasi cepat
```bash
python3 -m http.server 8080 --bind 0.0.0.0
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8080/index.html
```

Uji multiplayer cepat: buka dua tab, isi nama berbeda dan kode ruangan yang sama, lalu bandingkan HUD `👥 2`, posisi orbit, tombol warp hanya aktif di host, dan HP/asteroid yang hancur di satu tab ikut berubah di tab lain. Status `· relay` menunjukkan kredensial TURN berhasil dimuat. Untuk menguji fallback, blokir `cdn.jsdelivr.net` — splash tetap bisa diluncurkan dan status berubah menjadi offline.
