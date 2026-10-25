# Deploy VPS native: Caddy + Node.js + systemd

Mode ini memakai **server WebSocket otoritatif** di VPS. Tidak perlu Docker, coturn, TURN, atau port UDP. Hanya TCP `80` dan `443` yang perlu dibuka.

GitHub Pages tetap memakai multiplayer P2P + Cloudflare TURN Worker yang terpisah. Ruangan VPS dan ruangan GitHub Pages **tidak saling terhubung**.

## Prasyarat

- Ubuntu 22.04 atau 24.04 LTS.
- Domain dengan record `A` mengarah ke IP VPS (tunggu propagasi DNS).
- Akses `sudo` dan port `22`, `80`, `443` terbuka.
- Node.js 20+ (disarankan 22), Caddy 2, Git, dan npm.

Contoh instalasi di Ubuntu:

```bash
sudo apt update
sudo apt install -y git curl ca-certificates debian-keyring debian-archive-keyring apt-transport-https

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy

node --version
caddy version
```

## Instalasi

```bash
git clone https://github.com/arminewbie114/jelajah-antariksa.git
cd jelajah-antariksa
sudo ./deploy/install.sh nse.example.com
```

Ganti `nse.example.com` dengan domain Anda. Script akan:

1. Menyalin situs statis ke `/opt/nse` dan backend ke `/opt/nse-backend` (di luar web root).
2. Menjalankan `npm ci --omit=dev` untuk dependensi `ws`.
3. Membuat user sistem `nse`.
4. Menulis `/etc/nse/nse.env` jika belum ada.
5. Memasang dan mengaktifkan `nse.service`.
6. Menulis `/etc/caddy/Caddyfile`, memvalidasi, lalu reload Caddy.
7. Memeriksa `/health` di `127.0.0.1:8787`.

> Script **mengganti** `/etc/caddy/Caddyfile` dan menyimpan backup bernama `Caddyfile.bak.<timestamp>`. Jika VPS sudah punya situs lain, gabungkan konfigurasi dari `deploy/Caddyfile` secara manual.

## Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Jangan membuka port `8787` ke publik. Node hanya mendengarkan di `127.0.0.1`; Caddy yang meneruskan `/api/*`, `/health`, dan `/ws`.

## Konfigurasi

Edit `/etc/nse/nse.env`:

```ini
HOST=127.0.0.1
PORT=8787
PUBLIC_ORIGIN=https://nse.example.com
MAX_PLAYERS=16
MAX_ROOMS=100
ROOM_IDLE_MS=300000
SERVE_STATIC=0
```

- `PUBLIC_ORIGIN` harus sama dengan origin HTTPS yang dibuka pemain. Untuk beberapa origin, gunakan `ALLOWED_ORIGINS` dengan pemisah koma.
- `MAX_PLAYERS` default 16 dan belum diuji untuk beban lebih besar.
- `ROOM_IDLE_MS` adalah waktu sebelum ruangan kosong dihapus.
- `SERVE_STATIC=1` hanya untuk pengujian lokal tanpa Caddy.

Setelah mengubah env:

```bash
sudo systemctl restart nse
```

## Verifikasi

```bash
curl -fsS https://nse.example.com/api/config
curl -fsS https://nse.example.com/health
sudo systemctl status nse caddy --no-pager
sudo journalctl -u nse -n 100 --no-pager
```

Buka `https://nse.example.com/` di dua tab atau dua perangkat, isi nama berbeda dan kode ruangan yang sama. Status harus menampilkan `· server`; pemain pertama menjadi `controller` dan pemain berikutnya `sinkron controller`. Tutup tab controller untuk memastikan controller berpindah.

## Update

```bash
cd jelajah-antariksa
git pull --ff-only
sudo ./deploy/install.sh nse.example.com
```

Script mempertahankan `/etc/nse/nse.env` yang sudah ada. Server dan situs statis diganti, dependensi dipasang ulang, lalu layanan direstart.

## Rollback

```bash
sudo systemctl stop nse
sudo cp /etc/caddy/Caddyfile.bak.<timestamp> /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Kode sebelumnya dapat dipulihkan dengan `git checkout <commit>` lalu menjalankan installer lagi.

## Batasan

- Otoritas server mencakup ruangan, presence, HP, kehancuran, respawn, asteroid, jam dunia, dan controller warp. Posisi kapal tetap dilaporkan client dan hanya divalidasi batasnya; ini bukan anti-cheat penuh.
- Data dunia disimpan di memori. Restart server mengosongkan ruangan dan mengembalikan HP/asteroid.
- Tidak ada akun, database, chat, atau PvP.
- Server hanya memakai TCP WebSocket; tidak ada WebRTC/TURN/coturn di VPS.
- GitHub Pages tetap memakai P2P. Isi `TURN_ENDPOINT` di `js/turn.js` setelah Worker Cloudflare dideploy agar relay P2P aktif.
