from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from ..auth import get_current_editor
from ..models import Post
from ..schemas import PostCreate, PostPublic, PostUpdate
from ..db import get_session

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("", response_model=list[PostPublic])
def list_posts(
    *,
    session: Session = Depends(get_session),
    q: Optional[str] = Query(None, description="Search in title or summary"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    status_filter: str = Query("published", description="published | draft | all"),
    weekday: Optional[str] = Query(None, description="Filter by weekday"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    order_by: str = Query("-created_at", description="Use -created_at or created_at"),
):
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
    if order_by == "-views":
        statement = statement.order_by(Post.views.desc(), Post.created_at.desc())
    elif order_by == "views":
        statement = statement.order_by(Post.views.asc(), Post.created_at.asc())
    elif order_by == "-created_at":
        statement = statement.order_by(Post.created_at.desc())
    else:
        statement = statement.order_by(Post.created_at.asc())
    statement = statement.offset(offset).limit(limit)
    return session.exec(statement).all()


@router.get("/{slug}", response_model=PostPublic)
def get_post(*, session: Session = Depends(get_session), slug: str):
    statement = select(Post).where(Post.slug == slug)
    post = session.exec(statement).first()
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
    existing = session.exec(select(Post).where(Post.slug == payload.slug)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Slug already exists")
    post = Post(**payload.dict())
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
    for key, value in update_data.items():
        setattr(post, key, value)
    post.updated_at = datetime.utcnow()
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

