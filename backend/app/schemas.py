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

