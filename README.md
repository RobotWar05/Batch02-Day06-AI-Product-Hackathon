# AI Di Khong - Trip Planning Demo

Prototype repo for Day 06 hackathon. Repo contains:

- `codebase/Backend`: FastAPI backend for login, chat session storage, trip parsing, search, and compare APIs.
- `codebase/demo-nemo`: React + Vite frontend, served through a small Express proxy.
- `codebase/Data`: mock travel datasets, schemas, and search rules.
- `spec`: product spec and hackathon docs.

## Team

`Dương Trường Giang - 2A202600990`
`Hoàng Lê Bách - 2A202600694`
`Trần Công Minh - 2A202600913`
`Nguyễn Việt Lương - 2A202600956`

## Prerequisites

- Python `3.11+` recommended
- Node.js `18+`
- `npm`

Optional:

- `GEMINI_API_KEY` if you want real Gemini calls. Without it, backend falls back to heuristic/mock behavior.

## Quick Start

Run backend first, then frontend.

### 1. Start backend

```bash
cd codebase/Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

If you have a Gemini key, add it to `codebase/Backend/.env`:

```env
GEMINI_API_KEY=your_key_here
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

Backend runs at `http://127.0.0.1:8000`.

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{"status":"ok"}
```

### 2. Start frontend

Open new terminal:

```bash
cd codebase/demo-nemo
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:3000`.

Default proxy config in `codebase/demo-nemo/.env`:

```env
BACKEND_URL="http://127.0.0.1:8000"
APP_URL="MY_APP_URL"
```

Open browser:

```text
http://127.0.0.1:3000
```

## How Demo Works

1. Frontend sends API calls to `/backend/...`.
2. `codebase/demo-nemo/server.ts` proxies those calls to FastAPI at `BACKEND_URL`.
3. Backend reads mock trip data from `codebase/Data` and local JSON state in `codebase/Backend/data`.
4. If Gemini key exists, parser and FAQ flows can call Gemini. If not, fallback logic still lets demo run.

## Useful Run Commands

### Frontend typecheck

```bash
cd codebase/demo-nemo
npm run lint
```

### Backend tests

Run after venv setup and dependency install:

```bash
cd codebase/Backend
source .venv/bin/activate
python -m pytest -q
```

### Extractor CLI only

If you want to test entity extraction without opening frontend:

```bash
cd codebase/Backend
source .venv/bin/activate
python cli.py
```

Or pass one prompt directly:

```bash
python cli.py "Tìm 2 vé máy bay từ Hà Nội đi Phú Quốc cuối tuần này"
```

## API Smoke Tests

### Demo login

```bash
curl -X POST http://127.0.0.1:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo user","password":"demo-nemo"}'
```

### Trip search

```bash
curl -X POST http://127.0.0.1:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "origin":"Hà Nội",
    "destination":"Phú Quốc",
    "date":"2026-06-07",
    "transport_mode":"flight",
    "passengers":2
  }'
```

## Repo Structure

```text
.
├── README.md
├── spec/
└── codebase/
    ├── Backend/
    ├── Data/
    └── demo-nemo/
```

## Troubleshooting

- `pytest: command not found`
  Use the backend virtual environment, then run `python -m pytest -q`.

- Frontend cannot reach backend
  Check FastAPI is running on `127.0.0.1:8000` and `codebase/demo-nemo/.env` still points `BACKEND_URL` there.

- AI responses show warning about missing Gemini
  Expected when `GEMINI_API_KEY` is not set. Demo still works with fallback logic.
