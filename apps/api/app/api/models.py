from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.model_status import ModelRoleStatus, ModelStatusItem, ModelStatusResponse

router = APIRouter(prefix="/models", tags=["models"])


@router.get("/status", response_model=ModelStatusResponse)
def get_model_status() -> ModelStatusResponse:
    settings = get_settings()
    configured_roles = [
        ("vision_ocr", settings.vision_ocr_model),
        ("structure", settings.structure_model),
        ("figure_quality", settings.figure_quality_model),
        ("figure_enhance", settings.figure_enhance_model),
    ]
    roles = [
        ModelStatusItem(
            role=role,
            model=model or "",
            status=ModelRoleStatus.READY if model else ModelRoleStatus.NOT_CONFIGURED,
        )
        for role, model in configured_roles
    ]
    return ModelStatusResponse(roles=roles)
