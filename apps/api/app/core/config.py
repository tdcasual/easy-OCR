from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    service_name: str = "easy-ocr-api"
    api_prefix: str = "/api"
    database_url: str = "sqlite:///./easy_ocr.sqlite3"
    storage_root: str = "../../storage"

    model_config = SettingsConfigDict(env_file=".env", env_prefix="EASY_OCR_")


@lru_cache
def get_settings() -> Settings:
    return Settings()
