#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  if [[ -n "${UVICORN_PID:-}" ]]; then
    kill "$UVICORN_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

cd /app/backend
export PYTHONPATH=/app/backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 &
UVICORN_PID=$!

cd /app/frontend
export API_URL_INTERNAL=http://127.0.0.1:8000
exec npm run start -- --hostname 0.0.0.0 --port 3003
