from enum import StrEnum

from pydantic import BaseModel


class ModelRoleStatus(StrEnum):
    READY = "ready"
    NOT_CONFIGURED = "not_configured"
    DEGRADED = "degraded"


class ModelStatusItem(BaseModel):
    role: str
    model: str
    status: ModelRoleStatus


class ModelStatusResponse(BaseModel):
    roles: list[ModelStatusItem]
