"""Scrape básico de metadados (Open Graph / JSON-LD) a partir de links afiliados."""

from __future__ import annotations

import json
import re
from html import unescape
from typing import Optional
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
)


def _meta_content(html: str, prop: str) -> Optional[str]:
    # og:title / twitter:title / name="description"
    patterns = [
        rf'<meta[^>]+(?:property|name)=["\']{re.escape(prop)}["\'][^>]+content=["\']([^"\']+)["\']',
        rf'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']{re.escape(prop)}["\']',
    ]
    for pattern in patterns:
        match = re.search(pattern, html, re.IGNORECASE)
        if match:
            return unescape(match.group(1).strip())
    return None


def _json_ld_price(html: str) -> Optional[str]:
    for match in re.finditer(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html,
        re.IGNORECASE | re.DOTALL,
    ):
        raw = match.group(1).strip()
        try:
            data = json.loads(raw)
        except Exception:
            continue
        items = data if isinstance(data, list) else [data]
        for item in items:
            if not isinstance(item, dict):
                continue
            offers = item.get("offers")
            if isinstance(offers, list) and offers:
                offers = offers[0]
            if isinstance(offers, dict):
                price = offers.get("price") or offers.get("lowPrice")
                currency = offers.get("priceCurrency") or "BRL"
                if price is not None:
                    try:
                        value = float(str(price).replace(",", "."))
                        return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                    except Exception:
                        return f"{currency} {price}"
            if item.get("price"):
                return str(item["price"])
    return None


def fetch_affiliate_preview(url: str) -> dict:
    """Segue redirects (meli.la → mercadolivre) e extrai título, imagem, preço e descrição."""
    cleaned = (url or "").strip()
    if not cleaned:
        raise ValueError("URL vazia")
    if not cleaned.startswith(("http://", "https://")):
        cleaned = "https://" + cleaned

    req = Request(
        cleaned,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "pt-BR,pt;q=0.9",
        },
        method="GET",
    )

    try:
        with urlopen(req, timeout=12) as resp:
            resolved = resp.geturl()
            charset = resp.headers.get_content_charset() or "utf-8"
            raw = resp.read(900_000)
            html = raw.decode(charset, errors="ignore")
    except HTTPError as exc:
        # Alguns sites bloqueiam bots; ainda assim pode haver HTML no body
        raw = exc.read(900_000) if exc.fp else b""
        html = raw.decode("utf-8", errors="ignore")
        resolved = exc.url or cleaned
        if not html:
            raise ValueError(f"Não foi possível abrir o link (HTTP {exc.code})") from exc
    except URLError as exc:
        raise ValueError(f"Falha de rede ao abrir o link: {exc.reason}") from exc

    title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    name = (
        _meta_content(html, "og:title")
        or _meta_content(html, "twitter:title")
        or (title_match.group(1) if title_match else None)
    )
    if name:
        name = unescape(re.sub(r"\s+", " ", name)).strip()

    image = _meta_content(html, "og:image") or _meta_content(html, "twitter:image")
    description = _meta_content(html, "og:description") or _meta_content(html, "description")
    price = _json_ld_price(html) or _meta_content(html, "product:price:amount")

    note = None
    if not name and not image:
        note = "Não foi possível extrair metadados automaticamente. Preencha manualmente."

    return {
        "name": name,
        "price": price,
        "image": image,
        "description": description,
        "affiliate_url": cleaned,
        "resolved_url": resolved,
        "note": note,
    }
