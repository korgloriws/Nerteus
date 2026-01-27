from functools import lru_cache
from pydantic import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Nerteus API"
    database_url: str = "sqlite:///./data/app.db"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60 * 24
    admin_email: str = "admin@example.com"
    admin_password: str = "admin123"
    allowed_origins: list[str] = ["*"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

