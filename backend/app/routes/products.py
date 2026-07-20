from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from ..affiliate_preview import fetch_affiliate_preview
from ..auth import get_current_editor
from ..db import get_session
from ..models import AffiliateProduct, Post
from ..schemas import (
    AffiliatePreviewRequest,
    AffiliatePreviewResponse,
    AffiliateProductCreate,
    AffiliateProductPublic,
    AffiliateProductUpdate,
)

router = APIRouter(prefix="/products", tags=["products"])


def _compute_expires_at(validity_days: int, from_dt: Optional[datetime] = None) -> Optional[datetime]:
    """0 ou negativo = nunca expira; >0 = from_dt + dias."""
    if validity_days is None or validity_days <= 0:
        return None
    base = from_dt or datetime.utcnow()
    return base + timedelta(days=int(validity_days))


def _is_visible(product: AffiliateProduct, now: Optional[datetime] = None) -> bool:
    if product.status != "active":
        return False
    if product.expires_at is None:
        return True
    return product.expires_at > (now or datetime.utcnow())


@router.get("", response_model=list[AffiliateProductPublic])
def list_products(
    *,
    session: Session = Depends(get_session),
    post_id: Optional[int] = Query(None),
    status_filter: str = Query("active", description="active | inactive | all"),
    include_expired: bool = Query(False),
    limit: int = Query(40, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    statement = select(AffiliateProduct)
    if post_id is not None:
        statement = statement.where(AffiliateProduct.post_id == post_id)
    if status_filter != "all":
        statement = statement.where(AffiliateProduct.status == status_filter)

    statement = statement.order_by(AffiliateProduct.created_at.desc()).offset(offset).limit(limit)
    rows = session.exec(statement).all()

    if include_expired or status_filter == "all":
        return rows

    now = datetime.utcnow()
    return [p for p in rows if _is_visible(p, now)]


@router.post("/preview", response_model=AffiliatePreviewResponse)
def preview_product(
    *,
    payload: AffiliatePreviewRequest,
    editor: str = Depends(get_current_editor),
):
    try:
        data = fetch_affiliate_preview(payload.url)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Falha ao ler o link: {exc}",
        ) from exc
    return AffiliatePreviewResponse(**data)


@router.get("/{product_id}", response_model=AffiliateProductPublic)
def get_product(*, session: Session = Depends(get_session), product_id: int):
    product = session.get(AffiliateProduct, product_id)
    if not product or not _is_visible(product):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    return product


@router.post("", response_model=AffiliateProductPublic, status_code=status.HTTP_201_CREATED)
def create_product(
    *,
    session: Session = Depends(get_session),
    payload: AffiliateProductCreate,
    editor: str = Depends(get_current_editor),
):
    if payload.post_id is not None and not session.get(Post, payload.post_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Post vinculado não existe")

    data = payload.dict()
    validity_days = int(data.get("validity_days") if data.get("validity_days") is not None else 30)
    data["validity_days"] = validity_days
    product = AffiliateProduct(**data)
    product.expires_at = _compute_expires_at(validity_days)
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


@router.put("/{product_id}", response_model=AffiliateProductPublic)
def update_product(
    *,
    session: Session = Depends(get_session),
    product_id: int,
    payload: AffiliateProductUpdate,
    editor: str = Depends(get_current_editor),
):
    product = session.get(AffiliateProduct, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")

    update_data = payload.dict(exclude_unset=True)
    if "post_id" in update_data and update_data["post_id"] is not None:
        if not session.get(Post, update_data["post_id"]):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Post vinculado não existe")

    for key, value in update_data.items():
        setattr(product, key, value)

    if "validity_days" in update_data:
        product.expires_at = _compute_expires_at(int(product.validity_days or 0))

    product.updated_at = datetime.utcnow()
    session.add(product)
    session.commit()
    session.refresh(product)
    return product


@router.delete("/{product_id}")
def delete_product(
    *,
    session: Session = Depends(get_session),
    product_id: int,
    editor: str = Depends(get_current_editor),
):
    product = session.get(AffiliateProduct, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    session.delete(product)
    session.commit()
    return {"ok": True, "id": product_id}
