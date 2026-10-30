"""Normalização de slugs amigáveis a URL (sem espaços/acentos)."""

from __future__ import annotations

import re
import unicodedata
from urllib.parse import unquote, unquote_plus


def slugify(value: str, *, fallback: str = "post") -> str:
    text = (value or "").strip()
    if not text:
        return fallback
    # remove acentos
    text = unicodedata.normalize("NFD", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = text.lower()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-{2,}", "-", text).strip("-")
    return text or fallback


def slug_lookup_candidates(raw: str) -> list[str]:
    """Gera variantes para achar posts antigos com slug 'sujo'."""
    if raw is None:
        return []
    variants: list[str] = []

    def add(value: str | None) -> None:
        if value is None:
            return
        for form in (
            value,
            value.strip(),
            unicodedata.normalize("NFC", value),
            unicodedata.normalize("NFD", value),
        ):
            if form and form not in variants:
                variants.append(form)

    add(raw)
    add(unquote(raw))
    add(unquote_plus(raw))
    # às vezes chega duplamente encoded
    add(unquote(unquote(raw)))
    return variants
