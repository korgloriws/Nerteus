# Nerteus — Portal de posts estilo streaming

Plataforma full-stack (FastAPI + Next.js) para publicação e consumo de posts com estética de streaming: carrosséis por tags, quick view, busca dinâmica, temas e painel admin com editor rich-text.

## Stack

- Backend: FastAPI, SQLModel, SQLite, JWT (admin), Uvicorn.
- Frontend: Next.js 13 (App Router), React, TailwindCSS, ReactQuill, next-themes, Heroicons.
- Infra: Docker/Docker Compose, Node 18.x, Python 3.11+.

## Estrutura

- `backend/`: API, modelos, rotas, seed e Dockerfile.
- `frontend/`: app Next.js, componentes e páginas.
- `docker-compose.yml`: sobe `api` e `web`.
- `data/`: base SQLite (persistida fora do contêiner).

## Rodando local

### Backend

```bash
cd backend
python -m venv .venv && . .venv/Scripts/activate  # ou equivalente bash
pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
set NEXT_PUBLIC_API_URL=http://localhost:8000  # Windows; use export em bash
npm install
npm run dev -- --hostname 0.0.0.0 --port 3000
```

### Docker

```bash
docker-compose up --build
```

Frontend em `http://localhost:3000`, backend em `http://localhost:8000`.

## Painel Admin

- Rota: `/admin`
- Login: credenciais definidas em `backend/app/config.py` (padrão: `admin@example.com` / `admin123`).
- Recursos: criar/editar/excluir posts, status (rascunho/publicado), tema do dia, tags, rich-text com cores/tamanhos, colar imagens (clipboard) e upload de capa.
- Proteção: aviso de saída se houver alterações não salvas; botão “Limpar” reseta o formulário.

## Frontend (público)

- Home com hero + carrosséis dinâmicos por tags, “Em alta agora” e “Top 10 do mês” (ordenados por views).
- Busca instantânea com drop-down de resultados (título, resumo, tags, imagem).
- Modal de quick view; página de post com tags clicáveis e relacionados por tag.
- Página por tag em `/tag/[tag]`.
- Tema claro/escuro, cores dinâmicas por categoria/dia.

## Métricas

- GET `/posts/{slug}` incrementa `views`.
- Listagem aceita `order_by=-views` para “mais lidos”.
- Frontend usa `views` para ordenar destaque/top.

## Endpoints principais

- `GET /posts?limit=&offset=&q=&tag=&status_filter=&weekday=&order_by=` (order_by: `-created_at`, `created_at`, `-views`, `views`)
- `GET /posts/{slug}`
- `POST /posts` (JWT)
- `PUT /posts/{id}` (JWT)
- `DELETE /posts/{id}` (JWT)
- `POST /auth/token` (login editor)

## Configuração

- Ajuste envs em `backend/app/config.py` (secret, credenciais admin, CORS, database_url).
- Para resetar a base: apague `data/app.db` e rode `python -m app.seed`.
