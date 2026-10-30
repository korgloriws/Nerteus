from functools import lru_cache
import json
import os
from typing import Any

try:
    # Pydantic v2 moved BaseSettings to pydantic-settings.
    from pydantic_settings import BaseSettings, SettingsConfigDict

    _HAS_PYDANTIC_SETTINGS = True
except Exception:
    from pydantic import BaseModel, Field

    _HAS_PYDANTIC_SETTINGS = False


if _HAS_PYDANTIC_SETTINGS:
    class Settings(BaseSettings):
        app_name: str = "Nerteus API"
        database_url: str = "sqlite:///./data/app.db"
        secret_key: str = "change-me"
        access_token_expire_minutes: int = 60 * 24
        admin_email: str = "admin@example.com"
        admin_password: str = "admin123"
        allowed_origins: str = "*"

        model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

        def cors_origins(self) -> list[str]:
            return _parse_allowed_origins(self.allowed_origins)

else:
    class Settings(BaseModel):
        app_name: str = "Nerteus API"
        database_url: str = "sqlite:///./data/app.db"
        secret_key: str = "change-me"
        access_token_expire_minutes: int = 60 * 24
        admin_email: str = "admin@example.com"
        admin_password: str = "admin123"
        allowed_origins: str = "*"

        def cors_origins(self) -> list[str]:
            return _parse_allowed_origins(self.allowed_origins)


def _parse_allowed_origins(value: str | None) -> list[str]:
    if not value:
        return ["*"]
    if value.strip().startswith("["):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(item) for item in parsed if str(item).strip()]
        except Exception:
            pass
    parts = [item.strip() for item in value.split(",") if item.strip()]
    return parts or ["*"]


def _parse_int(value: str | None, default: int) -> int:
    if value is None:
        return default
    try:
        return int(value)
    except ValueError:
        return default


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    if _HAS_PYDANTIC_SETTINGS:
        return Settings()

    payload: dict[str, Any] = {
        "app_name": os.getenv("APP_NAME", "Nerteus API"),
        "database_url": os.getenv("DATABASE_URL", "sqlite:///./data/app.db"),
        "secret_key": os.getenv("SECRET_KEY", "change-me"),
        "access_token_expire_minutes": _parse_int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"), 60 * 24),
        "admin_email": os.getenv("ADMIN_EMAIL", "admin@example.com"),
        "admin_password": os.getenv("ADMIN_PASSWORD", "admin123"),
        "allowed_origins": os.getenv("ALLOWED_ORIGINS", "*"),
    }
    return Settings(**payload)

