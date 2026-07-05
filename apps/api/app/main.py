from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.exports import router as exports_router
from app.api.jobs import router as jobs_router
from app.api.models import router as models_router
from app.api.review_issues import router as review_issues_router
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title="easy-OCR API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(jobs_router, prefix=settings.api_prefix)
app.include_router(exports_router, prefix=settings.api_prefix)
app.include_router(review_issues_router, prefix=settings.api_prefix)
app.include_router(models_router, prefix=settings.api_prefix)


@app.get(f"{settings.api_prefix}/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.service_name}
