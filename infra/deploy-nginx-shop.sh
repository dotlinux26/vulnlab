#!/usr/bin/env bash
# ============================================================
# deploy-nginx-shop.sh — Deploy vhost cho CyberShop Capstone Lab
# Domain mặc định: shop.ghedahaui.online -> http://127.0.0.1:7110
#
# Dùng trên SERVER (sudo):
#   sudo LETSENCRYPT_EMAIL=bạn@domain ./deploy-nginx-shop.sh
#   sudo LETSENCRYPT_EMAIL=... ./deploy-nginx-shop.sh <domain> <upstream>
#
# Script tự động:
#   1. Tìm nơi đặt conf (conf.d hoặc sites-available+symlink)
#   2. Ghi vhost HTTP-only -> lấy cert Let's Encrypt (webroot) -> ghi vhost HTTPS đầy đủ
#   3. nginx -t trước khi reload (lỗi thì giữ nguyên conf cũ, không cắt dịch vụ)
#   4. Health-check sau deploy
# Idempotent: chạy lại thoải mái; đã có cert thì bỏ qua certbot.
# ============================================================
set -euo pipefail

DOMAIN="${1:-shop.ghedahaui.online}"
UPSTREAM="${2:-http://127.0.0.1:7110}"
EMAIL="${LETSENCRYPT_EMAIL:-}"
WEBROOT="/var/www/html"

[[ $EUID -eq 0 ]] || { echo "[!] Phai chay bang sudo/root"; exit 1; }
command -v nginx >/dev/null || { echo "[!] Chua cai nginx"; exit 1; }

# --- 1) Xác định thư mục conf phù hợp với hệ ---
if [ -d /etc/nginx/conf.d ]; then
  CONF="/etc/nginx/conf.d/${DOMAIN}.conf"; ENABLE=""
elif [ -d /etc/nginx/sites-available ]; then
  CONF="/etc/nginx/sites-available/${DOMAIN}.conf"
  ENABLE="/etc/nginx/sites-enabled/${DOMAIN}.conf"
else
  echo "[!] Khong tim thay conf.d hoac sites-available"; exit 1
fi

# --- 2) Kiểm tra DNS trỏ về máy này (warn thôi, không chết) ---
SERVER_IP=$(curl -s -4 --max-time 5 ifconfig.me || true)
DNS_IP=$(dig +short "@8.8.8.8" "$DOMAIN" | tail -1 || true)
if [ -n "$SERVER_IP" ] && [ -n "$DNS_IP" ] && [ "$SERVER_IP" != "$DNS_IP" ]; then
  echo "[!] CANH BAO: $DOMAIN tro ve $DNS_IP nhung IP may nay la $SERVER_IP — certbot se that bai neu DNS chua update."
fi

gen_http() {
cat <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location /.well-known/acme-challenge/ { root ${WEBROOT}; }
    location / { return 301 https://\$host\$request_uri; }
}
EOF
}

gen_full() {
cat <<EOF
# CyberShop OWASP Capstone Lab (17) — deployed by deploy-nginx-shop.sh
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    client_max_body_size 10M;

    location / {
        proxy_pass ${UPSTREAM};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF
}

apply() { # $1 = nội dung conf
  local tmp; tmp=$(mktemp)
  printf '%s\n' "$1" > "$tmp"
  if ! nginx -t -c /etc/nginx/nginx.conf >/dev/null 2>&1; then
    # nginx -t chỉ pass khi conf mới nằm đúng chỗ — copy rồi test lại thật
    cp "$tmp" "$CONF"
    [ -n "$ENABLE" ] && ln -sf "$CONF" "$ENABLE"
    if ! nginx -t 2>/tmp/opencode/nginx-test.err; then
      echo "[!] nginx -t FAIL — rollback:"; cat /tmp/opencode/nginx-test.err
      rm -f "$CONF"; [ -n "$ENABLE" ] && rm -f "$ENABLE"
      nginx -t && systemctl reload nginx || true
      exit 1
    fi
  else
    cp "$tmp" "$CONF"
    [ -n "$ENABLE" ] && ln -sf "$CONF" "$ENABLE"
    nginx -t
  fi
  rm -f "$tmp"
  systemctl reload nginx
  echo "[+] Conf ghi thanh cong: $CONF"
}

mkdir -p "$WEBROOT"

CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"
if [ -d "$CERT_DIR" ]; then
  echo "[=] Cert da ton tai — ghi vhost HTTPS day du."
  apply "$(gen_full)"
else
  echo "[*] Buoc 1/2: ghi vhost HTTP de lay cert..."
  apply "$(gen_http)"

  [ -n "$EMAIL" ] || { echo "[!] Dat LETSENCRYPT_EMAIL=... de dang ky Let's Encrypt"; exit 1; }
  command -v certbot >/dev/null || { apt-get install -y certbot || yum install -y certbot; }

  echo "[*] Buoc 2/2: certbot certonly cho $DOMAIN ..."
  certbot certonly --webroot -w "$WEBROOT" -d "$DOMAIN" \
    --email "$EMAIL" --agree-tos -n --keep-until-expiring

  apply "$(gen_full)"
fi

sleep 1
CODE=$(curl -sk -o /dev/null -w '%{http_code}' "https://${DOMAIN}/healthz" || echo 000)
echo "[*] Health https://${DOMAIN}/healthz -> HTTP $CODE"
[ "$CODE" = "200" ] && echo "[✓] DEPLOY OK — CyberShop dang chay." \
                    || echo "[!] Web chua tra ve 200 — kiem tra docker compose ps (lab phai up truoc)."
