FROM node:20-bookworm-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ .
RUN mkdir -p public
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip3 install --no-cache-dir -r /app/backend/requirements.txt --break-system-packages
COPY backend/app /app/backend/app

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=frontend-builder /app/frontend/.next ./.next
COPY --from=frontend-builder /app/frontend/public ./public
COPY frontend/next.config.mjs ./next.config.mjs

RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV PYTHONUNBUFFERED=1
ENV API_URL_INTERNAL=http://127.0.0.1:8000
ENV DATABASE_URL=sqlite:////app/data/app.db

WORKDIR /app
COPY scripts/start-prod.sh /app/start-prod.sh
RUN chmod +x /app/start-prod.sh

EXPOSE 3003
CMD ["/app/start-prod.sh"]
