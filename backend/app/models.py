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
    hero_image: Optional[str] = None
    status: str = Field(default="published", index=True)
    weekday: Optional[str] = Field(default=None, index=True)
    day_theme: Optional[str] = None
    views: int = Field(default=0, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow, index=True)

