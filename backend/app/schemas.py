from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class PostBase(SQLModel):
    title: str
    slug: str
    summary: Optional[str] = None
    content: str
    tags: list[str] = Field(default_factory=list)
    hero_image: Optional[str] = None
    status: str = "published"
    weekday: Optional[str] = None
    day_theme: Optional[str] = None


class PostCreate(PostBase):
    pass


class PostUpdate(SQLModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[list[str]] = None
    hero_image: Optional[str] = None
    status: Optional[str] = None
    weekday: Optional[str] = None
    day_theme: Optional[str] = None


class PostPublic(PostBase):
    id: int
    created_at: datetime
    updated_at: datetime
    views: int

    class Config:
        orm_mode = True


class AffiliateProductBase(SQLModel):
    name: str
    affiliate_url: str
    price: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    coupon: Optional[str] = None
    validity_days: int = 30  # 0 = nunca expira
    post_id: Optional[int] = None
    status: str = "active"


class AffiliateProductCreate(AffiliateProductBase):
    pass


class AffiliateProductUpdate(SQLModel):
    name: Optional[str] = None
    affiliate_url: Optional[str] = None
    price: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    coupon: Optional[str] = None
    validity_days: Optional[int] = None
    post_id: Optional[int] = None
    status: Optional[str] = None


class AffiliateProductPublic(AffiliateProductBase):
    id: int
    expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class AffiliatePreviewRequest(SQLModel):
    url: str


class AffiliatePreviewResponse(SQLModel):
    name: Optional[str] = None
    price: Optional[str] = None
    image: Optional[str] = None
    description: Optional[str] = None
    affiliate_url: str
    resolved_url: Optional[str] = None
    note: Optional[str] = None
