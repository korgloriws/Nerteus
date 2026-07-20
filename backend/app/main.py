from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from .config import get_settings
from .db import engine, ensure_columns
from .routes import auth, comments, posts, products


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        # Import models so create_all sees AffiliateProduct / Comment
        from . import models  # noqa: F401

        SQLModel.metadata.create_all(engine)
        ensure_columns()

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(auth.router)
    app.include_router(posts.router)
    app.include_router(products.router)
    app.include_router(comments.router)
    return app


app = create_app()

