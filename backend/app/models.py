from datetime import datetime
from typing import Optional

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class Post(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    slug: str = Field(index=True, unique=True)
    summary: Optional[str] = None
    content: str
    tags: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    related_ids: list[int] = Field(default_factory=list, sa_column=Column(JSON))
    related_product_ids: list[int] = Field(default_factory=list, sa_column=Column(JSON))
    hero_image: Optional[str] = None
    status: str = Field(default="published", index=True)
    weekday: Optional[str] = Field(default=None, index=True)
    day_theme: Optional[str] = None
    views: int = Field(default=0, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class AffiliateProduct(SQLModel, table=True):
    """Produto afiliado (ex.: Mercado Livre) para a loja."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    affiliate_url: str
    price: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    coupon: Optional[str] = None
    # None = nunca expira; caso contrário some da loja pública após esta data
    expires_at: Optional[datetime] = Field(default=None, index=True)
    # Dias usados no formulário (0 = nunca; padrão 30). Recalcula expires_at no save.
    validity_days: int = Field(default=30)
    post_id: Optional[int] = Field(default=None, index=True, foreign_key="post.id")
    status: str = Field(default="active", index=True)  # active | inactive
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow, index=True)


class Comment(SQLModel, table=True):
    """Comentário em uma postagem (anônimo ou identificado)."""

    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(index=True, foreign_key="post.id")
    body: str
    is_anonymous: bool = Field(default=False)
    author_name: Optional[str] = None
    author_email: Optional[str] = None  # nunca exposto na API pública
    status: str = Field(default="published", index=True)  # published | hidden
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)

