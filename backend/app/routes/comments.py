from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from ..auth import get_current_editor
from ..db import get_session
from ..models import Comment, Post
from ..schemas import CommentCreate, CommentPublic

router = APIRouter(prefix="/comments", tags=["comments"])


def _to_public(comment: Comment) -> CommentPublic:
    if comment.is_anonymous:
        display_name = "Anônimo"
    else:
        display_name = (comment.author_name or "").strip() or "Leitor"

    return CommentPublic(
        id=comment.id or 0,
        post_id=comment.post_id,
        body=comment.body,
        is_anonymous=comment.is_anonymous,
        author_name=display_name,
        created_at=comment.created_at,
    )


@router.get("", response_model=list[CommentPublic])
def list_comments(
    *,
    session: Session = Depends(get_session),
    post_id: int = Query(..., description="ID do post"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    statement = (
        select(Comment)
        .where(Comment.post_id == post_id)
        .where(Comment.status == "published")
        .order_by(Comment.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    rows = session.exec(statement).all()
    return [_to_public(c) for c in rows]


@router.post("", response_model=CommentPublic, status_code=status.HTTP_201_CREATED)
def create_comment(*, session: Session = Depends(get_session), payload: CommentCreate):
    post = session.get(Post, payload.post_id)
    if not post or post.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post não encontrado")

    body = (payload.body or "").strip()
    if len(body) < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comentário muito curto")
    if len(body) > 2000:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comentário muito longo")

    is_anonymous = bool(payload.is_anonymous)
    author_name: Optional[str] = None
    author_email: Optional[str] = None

    if is_anonymous:
        author_name = None
        author_email = None
    else:
        author_name = (payload.author_name or "").strip()
        if not author_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Informe um nome ou marque como anônimo",
            )
        if len(author_name) > 80:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nome muito longo")
        email = (payload.author_email or "").strip()
        if email:
            if "@" not in email or "." not in email.split("@")[-1]:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail inválido")
            if len(email) > 120:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="E-mail muito longo")
            author_email = email

    comment = Comment(
        post_id=payload.post_id,
        body=body,
        is_anonymous=is_anonymous,
        author_name=author_name,
        author_email=author_email,
        status="published",
    )
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return _to_public(comment)


@router.delete("/{comment_id}")
def delete_comment(
    *,
    session: Session = Depends(get_session),
    comment_id: int,
    editor: str = Depends(get_current_editor),
):
    comment = session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comentário não encontrado")
    session.delete(comment)
    session.commit()
    return {"ok": True, "id": comment_id}
