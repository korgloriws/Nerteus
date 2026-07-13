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

echo "==> Criando .env"
cat > .env <<EOF
NEXT_PUBLIC_API_URL=http://${VPS_IP}:8000
DATABASE_URL=sqlite:///./data/app.db
SECRET_KEY=$(openssl rand -hex 32)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-admin-password
EOF

mkdir -p data

echo "==> Build e subida"
docker compose down --remove-orphans || true
docker compose build --no-cache
docker compose up -d

echo "==> Status"
docker compose ps

echo "==> Testes locais na VPS"
sleep 5
curl -fsS http://localhost:8000/health || echo "API ainda nao respondeu"
curl -fsSI http://localhost:3000 | head -n 1 || echo "WEB ainda nao respondeu"

echo ""
echo "Deploy finalizado."
echo "Frontend: http://${VPS_IP}:3000"
echo "API:      http://${VPS_IP}:8000/health"
echo "Admin:    http://${VPS_IP}:3000/admin"
