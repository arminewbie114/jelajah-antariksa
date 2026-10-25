#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "Jalankan dengan sudo: sudo ./deploy/install.sh nse.example.com" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DOMAIN="${1:-}"

if [ -z "$DOMAIN" ]; then
  read -r -p "Domain VPS (contoh: nse.example.com): " DOMAIN
fi

if ! [[ "$DOMAIN" =~ ^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$ ]] || [[ "$DOMAIN" != *.* ]]; then
  echo "Domain tidak valid: $DOMAIN" >&2
  exit 1
fi

for command in node npm caddy systemctl curl; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Perintah '$command' tidak ditemukan. Ikuti deploy/README.md untuk instalasi prasyarat." >&2
    exit 1
  fi
done

NODE_MAJOR="$(node -p "Number(process.versions.node.split('.')[0])")"
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "Node.js 20+ diperlukan; ditemukan $(node --version)." >&2
  exit 1
fi

for file in index.html css/style.css js/main.js js/net.js js/net-utils.js js/multiplayer-server.js server/index.js server/room.js server/world.js server/package-lock.json; do
  if [ ! -f "$REPO_ROOT/$file" ]; then
    echo "File proyek tidak ditemukan: $REPO_ROOT/$file" >&2
    exit 1
  fi
done

echo "[1/6] Menyiapkan direktori dan user layanan"
install -d -o root -g root -m 755 /opt/nse /opt/nse-backend
if ! id nse >/dev/null 2>&1; then
  useradd --system --home-dir /opt/nse --shell /usr/sbin/nologin nse
fi

echo "[2/6] Menyalin situs statis dan backend"
rm -rf /opt/nse/css /opt/nse/js /opt/nse/server /opt/nse-backend
cp -a "$REPO_ROOT/css" /opt/nse/css
cp -a "$REPO_ROOT/js" /opt/nse/js
install -m 644 "$REPO_ROOT/index.html" /opt/nse/index.html
install -d -o root -g root -m 755 /opt/nse-backend
for file in index.js room.js world.js package.json package-lock.json; do
  install -m 644 "$REPO_ROOT/server/$file" "/opt/nse-backend/$file"
done

echo "[3/6] Memasang dependensi backend"
npm ci --omit=dev --prefix /opt/nse-backend --no-audit --no-fund

echo "[4/6] Menulis konfigurasi layanan"
install -d -o root -g nse -m 750 /etc/nse
if [ ! -f /etc/nse/nse.env ]; then
  sed "s#https://nse.example.com#https://$DOMAIN#g" "$SCRIPT_DIR/nse.env.example" > /etc/nse/nse.env
  chown root:nse /etc/nse/nse.env
  chmod 640 /etc/nse/nse.env
else
  echo "Mempertahankan /etc/nse/nse.env yang sudah ada; pastikan PUBLIC_ORIGIN=https://$DOMAIN."
fi

install -m 644 "$SCRIPT_DIR/nse.service" /etc/systemd/system/nse.service
CADDY_BACKUP=""
if [ -f /etc/caddy/Caddyfile ]; then
  CADDY_BACKUP="/etc/caddy/Caddyfile.bak.$(date +%Y%m%d%H%M%S)"
  cp -a /etc/caddy/Caddyfile "$CADDY_BACKUP"
fi
sed "s/nse.example.com/$DOMAIN/g" "$SCRIPT_DIR/Caddyfile" > /etc/caddy/Caddyfile
if ! caddy validate --config /etc/caddy/Caddyfile; then
  if [ -n "$CADDY_BACKUP" ]; then
    cp -a "$CADDY_BACKUP" /etc/caddy/Caddyfile
    echo "Konfigurasi Caddy tidak valid; Caddyfile lama dipulihkan dari $CADDY_BACKUP." >&2
  else
    echo "Konfigurasi Caddy tidak valid; Caddy tidak direstart." >&2
  fi
  exit 1
fi

chown -R root:root /opt/nse /opt/nse-backend
chmod -R u=rwX,go=rX /opt/nse /opt/nse-backend

echo "[5/6] Mengaktifkan layanan"
systemctl daemon-reload
systemctl enable nse >/dev/null
systemctl restart nse
systemctl enable caddy >/dev/null 2>&1 || true
systemctl reload caddy 2>/dev/null || systemctl restart caddy

echo "[6/6] Memeriksa kesehatan backend"
HEALTHY=0
for _ in $(seq 1 15); do
  if curl -fsS http://127.0.0.1:8787/health >/dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep 1
done
if [ "$HEALTHY" -ne 1 ]; then
  echo "Backend tidak merespons. Periksa: journalctl -u nse -n 100 --no-pager" >&2
  exit 1
fi

curl -fsS http://127.0.0.1:8787/api/config
printf '\n\nSelesai. Buka https://%s/ lalu uji dua tab dengan kode ruangan yang sama.\n' "$DOMAIN"
printf 'Status: systemctl status nse caddy\nLog: journalctl -u nse -f\n'
