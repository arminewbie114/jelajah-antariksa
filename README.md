<<<<<<< HEAD
# jelajah-antariksa
=======
# 🚀 Nusantara Space Explorer

Web penjelajah antariksa 3D FPS berbahasa Indonesia — terbangkan pesawat futuristik (NSX Vanguard, Odyssey, Aurora) ke 8 planet + Bulan + Pluto + 3 eksoplanet nyata + lubang hitam Cygnus X-1.

## Cara menjalankan (2 pilihan)

**Paling mudah (Windows):**
1. Buka folder ini, double-klik `index.html` — bisa jalan, tapi mode module + CDN butuh internet.
2. Disarankan: klik kanan folder → *Open with VS Code* → extension *Live Server* → *Go Live*.

**Via Python (disarankan agar module aman):**
```powershell
cd "$env:USERPROFILE\Desktop\nusantara-space-explorer"
python -m http.server 8080
# buka http://localhost:8080
```

## Kontrol
- Desktop: WASD + Mouse (klik canvas untuk kunci mouse), Spasi/Ctrl naik-turun, Shift boost, J warp, C kokpit/free-fly, E info, M peta+autopilot, R bensin, 1/2/3 ganti pesawat.
- Mobile: stik kiri = maju/mundur/strafe, stik kanan = arahkan atas/bawah/kiri/kanan.
- HP: joystick kiri + geser kanan untuk lihat + tombol ▲ 🌌 ℹ️ 🪟.

## Akurasi data (NASA Planetary Fact Sheet)
Diameter, jarak AU, periode orbit, suhu, gravitasi akurat. Skala render dikompresi (jarak 1:4000, diameter log) + warp drive agar playable — dijelaskan di panel info & help. Tekstur prosedural Canvas meniru warna asli NASA (tanpa download 500MB).

## Teknologi
- Three.js 0.160 via CDN (importmap), tanpa build — siap hosting statis (Vercel/Netlify/GitHub Pages).
- Upgrade ke Vite: `npm create vite@latest` lalu pindahkan `js/` ke `src/` dan `npm i three`.

## Struktur
```
index.html  — splash, HUD, panel info, peta, kontrol mobile
css/style.css
js/dataPlanets.js — data akurat NASA (sumber kebenaran)
js/main.js — scene, orbit, pesawat bersayap, FPS controls, autopilot, minimap, audio
```
>>>>>>> 5bc37e8 (Nusantara Space Explorer — siap GitHub Pages)
