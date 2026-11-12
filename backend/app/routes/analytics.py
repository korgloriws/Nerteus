from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from ..auth import get_current_editor
from ..db import get_session
from ..models import Post, PostViewEvent
from .posts import _find_post_by_slug

router = APIRouter(prefix="/analytics", tags=["analytics"])


class ViewEventIn(BaseModel):
    slug: str
    surface: str = Field(default="intro")  # intro | read
    device: str = Field(default="unknown")
    session_id: Optional[str] = None
    weekday: Optional[str] = None
    day_theme: Optional[str] = None


def _parse_dt(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    raw = value.strip()
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    dt = datetime.fromisoformat(raw)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _as_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _period_range(
    period: str,
    date_from: Optional[str],
    date_to: Optional[str],
) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    end = now
    if period == "day":
        start = now - timedelta(days=1)
    elif period == "week":
        start = now - timedelta(days=7)
    elif period == "month":
        start = now - timedelta(days=30)
    elif period == "year":
        start = now - timedelta(days=365)
    elif period == "custom":
        start = _parse_dt(date_from) or (now - timedelta(days=30))
        end = _parse_dt(date_to) or now
        if end < start:
            start, end = end, start
        # inclui o dia final inteiro se veio só a data
        if date_to and len(date_to) <= 10:
            end = end + timedelta(days=1) - timedelta(microseconds=1)
    else:
        start = now - timedelta(days=7)
    return start, end


@router.post("/view", status_code=status.HTTP_204_NO_CONTENT)
def register_view_event(
    *,
    session: Session = Depends(get_session),
    payload: ViewEventIn,
):
    """Registra evento bruto + incrementa views do post (home Top 10)."""
    post = _find_post_by_slug(session, payload.slug)
    if not post or post.status != "published":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    surface = payload.surface if payload.surface in ("intro", "read") else "intro"
    device = payload.device if payload.device in ("mobile", "tablet", "desktop", "unknown") else "unknown"

    sid = (payload.session_id or "")[:64] or None

    # Contador eterno da home: 1x por sessão/post (intro+read = 2 eventos, 1 view)
    should_count = True
    if sid and post.id is not None:
        prior = session.exec(
            select(PostViewEvent).where(
                PostViewEvent.post_id == post.id,
                PostViewEvent.session_id == sid,
            ).limit(1)
        ).first()
        should_count = prior is None

    session.add(
        PostViewEvent(
            post_id=post.id or 0,
            slug=post.slug,
            title=post.title,
            weekday=payload.weekday or post.weekday,
            day_theme=payload.day_theme or post.day_theme,
            device=device,
            surface=surface,
            session_id=sid,
        )
    )

    if should_count:
        post.views = (post.views or 0) + 1
        session.add(post)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/overview")
def analytics_overview(
    *,
    session: Session = Depends(get_session),
    editor: str = Depends(get_current_editor),
    period: str = Query("week", description="day|week|month|year|custom"),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
):
    """Agregados para o painel do editor (não altera a home)."""
    start, end = _period_range(period, date_from, date_to)

    statement = select(PostViewEvent).where(
        PostViewEvent.created_at >= start,
        PostViewEvent.created_at <= end,
    )
    events = list(session.exec(statement).all())

    total = len(events)
    sessions = {e.session_id for e in events if e.session_id}
    unique_sessions = len(sessions)

    by_post: Counter[int] = Counter()
    post_meta: dict[int, dict] = {}
    by_hour: Counter[int] = Counter()
    by_device: Counter[str] = Counter()
    by_theme: Counter[str] = Counter()
    by_surface: Counter[str] = Counter()
    by_day: Counter[str] = Counter()

    for e in events:
        by_post[e.post_id] += 1
        post_meta[e.post_id] = {
            "post_id": e.post_id,
            "slug": e.slug,
            "title": e.title or e.slug,
            "weekday": e.weekday,
            "day_theme": e.day_theme,
        }
        created = _as_utc(e.created_at)
        by_hour[created.hour] += 1
        by_device[e.device or "unknown"] += 1
        theme_key = (e.day_theme or e.weekday or "sem tema").strip() or "sem tema"
        by_theme[theme_key] += 1
        by_surface[e.surface or "intro"] += 1
        by_day[created.strftime("%Y-%m-%d")] += 1

    top_posts = []
    for post_id, count in by_post.most_common(15):
        meta = post_meta.get(post_id, {"post_id": post_id, "slug": "", "title": f"#{post_id}"})
        top_posts.append({**meta, "views": count})

    # Dentro de cada tema: top posts
    theme_posts: dict[str, Counter[int]] = defaultdict(Counter)
    for e in events:
        theme_key = (e.day_theme or e.weekday or "sem tema").strip() or "sem tema"
        theme_posts[theme_key][e.post_id] += 1

    by_theme_breakdown = []
    for theme, counter in sorted(theme_posts.items(), key=lambda kv: sum(kv[1].values()), reverse=True):
        posts_in_theme = []
        for post_id, count in counter.most_common(5):
            meta = post_meta.get(post_id, {"post_id": post_id, "slug": "", "title": f"#{post_id}"})
            posts_in_theme.append({**meta, "views": count})
        by_theme_breakdown.append(
            {
                "theme": theme,
                "views": int(sum(counter.values())),
                "posts": posts_in_theme,
            }
        )

    peak_hour = None
    if by_hour:
        peak_hour = max(by_hour.items(), key=lambda kv: kv[1])[0]

    hourly = [{"hour": h, "views": by_hour.get(h, 0)} for h in range(24)]
    daily = [{"date": d, "views": c} for d, c in sorted(by_day.items())]
    devices = [{"device": k, "views": v} for k, v in by_device.most_common()]
    themes = [{"theme": k, "views": v} for k, v in by_theme.most_common()]
    surfaces = [{"surface": k, "views": v} for k, v in by_surface.most_common()]

    # Compara com contador eterno dos posts (diagnóstico)
    post_counters = []
    for row in top_posts[:10]:
        post = session.get(Post, row["post_id"])
        post_counters.append(
            {
                **row,
                "lifetime_views": (post.views if post else 0) or 0,
            }
        )

    return {
        "period": period,
        "start": start.isoformat(),
        "end": end.isoformat(),
        "totals": {
            "views": total,
            "unique_sessions": unique_sessions,
            "unique_posts": len(by_post),
            "peak_hour": peak_hour,
            "top_device": devices[0]["device"] if devices else None,
            "top_theme": themes[0]["theme"] if themes else None,
        },
        "hourly": hourly,
        "daily": daily,
        "devices": devices,
        "themes": themes,
        "surfaces": surfaces,
        "top_posts": top_posts,
        "top_posts_with_lifetime": post_counters,
        "theme_breakdown": by_theme_breakdown,
    }
