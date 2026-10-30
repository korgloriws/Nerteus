#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/nerteus"
REPO_URL="https://github.com/korgloriws/Nerteus.git"
VPS_IP="${VPS_IP:-31.97.167.75}"

echo "==> Parando containers antigos (se existirem)"
if [ -f "$APP_DIR/docker-compose.yml" ]; then
  cd "$APP_DIR"
  docker compose down --remove-orphans || true
fi

echo "==> Preparando pasta $APP_DIR"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [ -d ".git" ]; then
  echo "==> Atualizando repositorio"
  git fetch --all
  git reset --hard origin/main
  git clean -fd
else
  echo "==> Clonando repositorio"
  git clone "$REPO_URL" .
fi

if [ ! -f ".env" ]; then
  echo "==> Criando .env"
  cat > .env <<EOF
DATABASE_URL=sqlite:////app/data/app.db
SECRET_KEY=$(openssl rand -hex 32)
ADMIN_EMAIL=nerteus@nerteus.com
ADMIN_PASSWORD=change-this-admin-password
EOF
fi

mkdir -p data

echo "==> Build e subida (container unico)"
docker compose down --remove-orphans || true
docker compose build --no-cache
docker compose up -d

echo "==> Status"
docker compose ps

echo "==> Testes locais na VPS"
sleep 8
curl -fsSI http://localhost:3000 | head -n 1 || echo "Site ainda nao respondeu"
curl -fsS -X POST "http://localhost:3000/api/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"'"$(grep '^ADMIN_EMAIL=' .env | cut -d= -f2-)"'","password":"'"$(grep '^ADMIN_PASSWORD=' .env | cut -d= -f2-)"'"}' \
  || echo "Login API ainda nao respondeu"

echo ""
echo "Deploy finalizado."
echo "Site:  http://${VPS_IP}:3000"
echo "Admin: http://${VPS_IP}:3000/admin"
