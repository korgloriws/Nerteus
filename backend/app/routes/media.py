import base64
import os
import re
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlmodel import Session, select

from ..auth import get_current_editor
from ..config import get_settings
from ..db import get_session
from ..models import Media

router = APIRouter(prefix="/media", tags=["media"])


def _get_media_dir() -> Path:
    settings = get_settings()
    db_url = settings.database_url
    if db_url.startswith("sqlite:///"):
        db_path = Path(db_url.removeprefix("sqlite:///"))
        data_dir = db_path.parent
    else:
        data_dir = Path("./data")
    media_dir = data_dir / "media"
    media_dir.mkdir(parents=True, exist_ok=True)
    return media_dir


MEDIA_DIR = _get_media_dir()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

DATA_URL_PATTERN = re.compile(r"^data:(image/\w+);base64,(.+)$", re.IGNORECASE)


class MediaUploadBase64(BaseModel):
    data: str
    filename: Optional[str] = None
    post_id: Optional[int] = None


class MediaPublic(BaseModel):
    id: int
    filename: str
    original_filename: Optional[str]
    content_type: str
    size_bytes: int
    post_id: Optional[int]
    url: str

    class Config:
        orm_mode = True


def _media_to_public(media: Media, base_url: str) -> MediaPublic:
    return MediaPublic(
        id=media.id,
        filename=media.filename,
        original_filename=media.original_filename,
        content_type=media.content_type,
        size_bytes=media.size_bytes,
        post_id=media.post_id,
        url=f"{base_url}/media/{media.id}",
    )


def _validate_and_save(
    content: bytes,
    content_type: str,
    original_filename: Optional[str],
    post_id: Optional[int],
    session: Session,
) -> Media:
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tipo não permitido: {content_type}. Permitidos: {', '.join(ALLOWED_TYPES)}",
        )
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Arquivo excede o limite de {MAX_SIZE_BYTES // (1024 * 1024)} MB",
        )

    ext_map = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}
    ext = ext_map.get(content_type, ".bin")
    unique_name = f"{uuid.uuid4().hex}{ext}"
    file_path = MEDIA_DIR / unique_name
    file_path.write_bytes(content)

    media = Media(
        filename=unique_name,
        original_filename=original_filename,
        content_type=content_type,
        size_bytes=len(content),
        post_id=post_id,
    )
    session.add(media)
    session.commit()
    session.refresh(media)
    return media


@router.post("", status_code=status.HTTP_201_CREATED)
def upload_media_multipart(
    *,
    session: Session = Depends(get_session),
    file: UploadFile = File(...),
    post_id: Optional[int] = Form(None),
    editor: str = Depends(get_current_editor),
) -> MediaPublic:
    """Upload de mídia via multipart/form-data (admin-only)."""
    content = file.file.read()
    content_type = file.content_type or "application/octet-stream"
    media = _validate_and_save(content, content_type, file.filename, post_id, session)
    return _media_to_public(media, "/api")


@router.post("/base64", status_code=status.HTTP_201_CREATED)
def upload_media_base64(
    *,
    session: Session = Depends(get_session),
    payload: MediaUploadBase64,
    editor: str = Depends(get_current_editor),
) -> MediaPublic:
    """Upload de mídia via JSON com data URL base64 (admin-only)."""
    match = DATA_URL_PATTERN.match(payload.data)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato inválido. Esperado: data:<mime>;base64,<dados>",
        )
    content_type = match.group(1).lower()
    base64_data = match.group(2)

    try:
        content = base64.b64decode(base64_data)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Falha ao decodificar base64",
        )

    media = _validate_and_save(content, content_type, payload.filename, payload.post_id, session)
    return _media_to_public(media, "/api")


@router.get("/{media_id}")
def get_media(*, session: Session = Depends(get_session), media_id: int):
    """Serve arquivo de mídia (público) com cache headers."""
    media = session.get(Media, media_id)
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mídia não encontrada")

    file_path = MEDIA_DIR / media.filename
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arquivo não encontrado")

    return FileResponse(
        path=file_path,
        media_type=media.content_type,
        filename=media.original_filename or media.filename,
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
            "ETag": f'"{media.id}-{int(media.created_at.timestamp())}"',
        },
    )


@router.get("")
def list_media(
    *,
    session: Session = Depends(get_session),
    post_id: Optional[int] = Query(None, description="Filtrar por post"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    editor: str = Depends(get_current_editor),
) -> list[MediaPublic]:
    """Lista mídias (admin-only)."""
    statement = select(Media).order_by(Media.created_at.desc())
    if post_id is not None:
        statement = statement.where(Media.post_id == post_id)
    statement = statement.offset(offset).limit(limit)
    rows = session.exec(statement).all()
    return [_media_to_public(m, "/api") for m in rows]


@router.delete("/{media_id}")
def delete_media(
    *,
    session: Session = Depends(get_session),
    media_id: int,
    editor: str = Depends(get_current_editor),
):
    """Apaga mídia (admin-only)."""
    media = session.get(Media, media_id)
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mídia não encontrada")

    file_path = MEDIA_DIR / media.filename
    if file_path.exists():
        file_path.unlink()

    session.delete(media)
    session.commit()
    return {"ok": True, "id": media_id}
