# easy-OCR API

FastAPI backend for the easy-OCR MVP.

## Development

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest
uvicorn app.main:app --reload
```
