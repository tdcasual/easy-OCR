# Contributing to easy-OCR

This repository contains a FastAPI backend and a Next.js debugging console.

## Development Setup

```bash
# Backend
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd apps/web
npm install
cp .env.example .env.local   # optional
npm run dev
```

## Verification

```bash
# From repository root
npm run api:test     # backend pytest
npm run web:check    # frontend typecheck + build
npm run web:smoke    # E2E smoke test (requires both servers running)
```

## Guidelines

- Keep changes focused on one concern per commit.
- Backend changes must keep `pytest` passing.
- Frontend changes must keep `npm run check` passing.
- Do not commit runtime data under `storage/`, build artifacts (`*.tsbuildinfo`, `*.egg-info/`), or `.env` files.
- Follow the existing code style and use the i18n dictionary for all visible UI strings.
