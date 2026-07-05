from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "easy-ocr-api"
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./easy_ocr.sqlite3"
    storage_root: str = "../../storage"
    vision_ocr_model: str = ""
    structure_model: str = ""
    figure_quality_model: str = ""
    figure_enhance_model: str = ""
    cors_origins: str = "http://127.0.0.1:3000"
    max_upload_bytes: int = 10 * 1024 * 1024  # 10 MB
    upload_content_types: str = "image/png,image/jpeg,image/webp"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="EASY_OCR_")


@lru_cache
def get_settings() -> Settings:
    return Settings()
