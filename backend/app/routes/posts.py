import base64
import re
from datetime import datetime, timezone
from typing import Optional

from urllib.parse import unquote

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import Response
from sqlmodel import Session, select

from ..auth import get_current_editor
from ..models import Post
from ..schemas import PostCard, PostCreate, PostPublic, PostUpdate
from ..db import get_session
from ..slugify import slug_lookup_candidates, slugify

router = APIRouter(prefix="/posts", tags=["posts"])

DATA_URL_PATTERN = re.compile(r"^data:image/(\w+);base64,(.+)$", re.IGNORECASE)


def _find_post_by_slug(session: Session, slug: str) -> Post | None:
    for candidate in slug_lookup_candidates(slug):
        post = session.exec(select(Post).where(Post.slug == candidate)).first()
        if post:
            return post
    # fallback: compara slug normalizado (posts antigos com acento/espaço)
    wanted = slugify(unquote(slug) if slug else "")
    if not wanted:
        return None
    for post in session.exec(select(Post)).all():
        if slugify(post.slug or "") == wanted:
            return post
    return None


def _post_to_card(post: Post, request: Request) -> PostCard:
    """Convert Post to lightweight PostCard with cover URL."""
    cover_url = None
    if post.hero_image:
        if post.hero_image.startswith("data:"):
            cover_url = f"/api/posts/{post.id}/cover"
        else:
            cover_url = post.hero_image
    return PostCard(
        id=post.id,
        title=post.title,
        slug=post.slug,
        summary=post.summary,
        tags=post.tags or [],
        cover_url=cover_url,
        status=post.status,
        weekday=post.weekday,
        day_theme=post.day_theme,
        created_at=post.created_at,
        views=post.views or 0,
    )


@router.get("")
def list_posts(
    *,
    request: Request,
    session: Session = Depends(get_session),
    q: Optional[str] = Query(None, description="Search in title or summary"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    status_filter: str = Query("published", description="published | draft | all"),
    weekday: Optional[str] = Query(None, description="Filter by weekday"),
    ids: Optional[str] = Query(None, description="Comma-separated post IDs"),
    limit: int = Query(20, ge=1, le=500),
    offset: int = Query(0, ge=0),
    order_by: str = Query("-created_at", description="Use -created_at or created_at"),
    view: Optional[str] = Query(None, description="card = lightweight for homepage"),
) -> list[PostPublic] | list[PostCard]:
    statement = select(Post)
    if q:
        like_term = f"%{q}%"
        statement = statement.where((Post.title.ilike(like_term)) | (Post.summary.ilike(like_term)))
    if tag:
        statement = statement.where(Post.tags.contains([tag]))
    if status_filter != "all":
        statement = statement.where(Post.status == status_filter)
    if weekday:
        statement = statement.where(Post.weekday == weekday)

    id_list: list[int] = []
    if ids:
        for part in ids.split(","):
            part = part.strip()
            if part.isdigit():
                id_list.append(int(part))
        if id_list:
            statement = statement.where(Post.id.in_(id_list))

    if order_by == "-views":
        statement = statement.order_by(Post.views.desc(), Post.created_at.desc())
    elif order_by == "views":
        statement = statement.order_by(Post.views.asc(), Post.created_at.asc())
    elif order_by == "-created_at":
        statement = statement.order_by(Post.created_at.desc())
    else:
        statement = statement.order_by(Post.created_at.asc())
    statement = statement.offset(offset).limit(limit)
    rows = session.exec(statement).all()

    # Preserva a ordem pedida em ids (útil para "continuar lendo")
    if id_list:
        by_id = {p.id: p for p in rows}
        rows = [by_id[i] for i in id_list if i in by_id]

    if view == "card":
        return [_post_to_card(p, request) for p in rows]
    return rows


@router.get("/{post_id}/cover", name="get_post_cover")
def get_post_cover(
    *,
    session: Session = Depends(get_session),
    post_id: int,
):
    """Serve hero image as binary with proper Content-Type and cache headers."""
    post = session.get(Post, post_id)
    if not post or not post.hero_image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cover not found")

    hero = post.hero_image
    if hero.startswith("http://") or hero.startswith("https://"):
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=hero, status_code=302)

    match = DATA_URL_PATTERN.match(hero)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid cover format")

    image_type = match.group(1).lower()
    base64_data = match.group(2)

    mime_map = {"jpeg": "image/jpeg", "jpg": "image/jpeg", "png": "image/png", "gif": "image/gif", "webp": "image/webp"}
    content_type = mime_map.get(image_type, f"image/{image_type}")

    try:
        image_bytes = base64.b64decode(base64_data)
    except Exception:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to decode cover")

    return Response(
        content=image_bytes,
        media_type=content_type,
        headers={
            "Cache-Control": "public, max-age=86400, immutable",
            "ETag": f'"{post.id}-{int(post.updated_at.timestamp())}"',
        },
    )


@router.get("/{slug}", response_model=PostPublic)
def get_post(*, session: Session = Depends(get_session), slug: str):
    post = _find_post_by_slug(session, slug)
    if not post or post.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    post.views = (post.views or 0) + 1
    session.add(post)
    session.commit()
    session.refresh(post)
    return post


@router.post("", response_model=PostPublic, status_code=status.HTTP_201_CREATED)
def create_post(
    *,
    session: Session = Depends(get_session),
    payload: PostCreate,
    editor: str = Depends(get_current_editor),
):
    data = payload.dict()
    data["slug"] = slugify(data.get("slug") or data.get("title") or "post")
    existing = session.exec(select(Post).where(Post.slug == data["slug"])).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already exists")
    post = Post(**data)
    if post.related_ids is None:
        post.related_ids = []
    if post.related_product_ids is None:
        post.related_product_ids = []
    session.add(post)
    session.commit()
    session.refresh(post)
    return post


@router.put("/{post_id}", response_model=PostPublic)
def update_post(
    *,
    session: Session = Depends(get_session),
    post_id: int,
    payload: PostUpdate,
    editor: str = Depends(get_current_editor),
):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    update_data = payload.dict(exclude_unset=True)
    if "related_ids" in update_data and update_data["related_ids"] is None:
        update_data["related_ids"] = []
    if "related_product_ids" in update_data and update_data["related_product_ids"] is None:
        update_data["related_product_ids"] = []
    if "slug" in update_data and update_data["slug"] is not None:
        update_data["slug"] = slugify(update_data["slug"] or post.title or "post")
        clash = session.exec(
            select(Post).where(Post.slug == update_data["slug"], Post.id != post_id)
        ).first()
        if clash:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already exists")
    for key, value in update_data.items():
        setattr(post, key, value)
    post.updated_at = datetime.now(timezone.utc)
    session.add(post)
    session.commit()
    session.refresh(post)
    return post


@router.delete("/{post_id}")
def delete_post(
    *,
    session: Session = Depends(get_session),
    post_id: int,
    editor: str = Depends(get_current_editor),
):
    post = session.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    session.delete(post)
    session.commit()
    # Retorna 200 com corpo (não 204): o proxy Next.js em produção
    # quebra ao repassar respostas sem body.
    return {"ok": True, "id": post_id}

