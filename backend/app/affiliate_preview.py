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

# Ex.: R$ 2.963 | R$ 2.963,90 | R$2963,00
_PRICE_RE = re.compile(
    r"R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\bR\$\s*\d+(?:,\d{2})?",
    re.IGNORECASE,
)
_PRICE_TAIL_RE = re.compile(
    r"\s*[-–—|·]\s*R\$\s*\d{1,3}(?:\.\d{3})*(?:,\d{2})?\s*$",
    re.IGNORECASE,
)


def _meta_content(html: str, prop: str) -> Optional[str]:
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
            # Só confia em Product / Offer tipados — páginas sociais misturam vários preços
            type_name = item.get("@type") or ""
            types = type_name if isinstance(type_name, list) else [type_name]
            types_l = {str(t).lower() for t in types}
            offers = item.get("offers")
            if isinstance(offers, list) and offers:
                offers = offers[0]
            if isinstance(offers, dict) and (
                types_l & {"product", "productgroup", "offer"} or item.get("name")
            ):
                price = offers.get("price") or offers.get("lowPrice")
                if price is not None:
                    return _format_brl(price)
            if item.get("price") and types_l & {"product", "offer"}:
                return _format_brl(item["price"])
    return None


def _format_brl(price) -> str:
    try:
        value = float(str(price).replace(",", "."))
        return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except Exception:
        text = str(price).strip()
        if text.upper().startswith("R$"):
            return text
        return f"R$ {text}"


def _extract_price_from_text(*parts: Optional[str]) -> Optional[str]:
    for part in parts:
        if not part:
            continue
        match = _PRICE_RE.search(part)
        if match:
            raw = match.group(0)
            # normaliza espaços: "R$2.963" -> "R$ 2.963"
            return re.sub(r"^R\$\s*", "R$ ", raw, flags=re.IGNORECASE).strip()
    return None


def _strip_price_from_text(text: Optional[str]) -> Optional[str]:
    if not text:
        return text
    cleaned = _PRICE_TAIL_RE.sub("", text).strip()
    cleaned = _PRICE_RE.sub("", cleaned)
    cleaned = re.sub(r"\s{2,}", " ", cleaned)
    cleaned = re.sub(r"\s*[-–—|·]\s*$", "", cleaned).strip(" -–—|·")
    return cleaned or text


def _prefer_image(url: Optional[str]) -> Optional[str]:
    """Mercado Livre: -P/-I são thumbs; -O costuma ser maior."""
    if not url:
        return url
    upgraded = re.sub(r"-(P|I)\.(webp|jpe?g|png)(\?.*)?$", r"-O.\2", url, flags=re.IGNORECASE)
    return upgraded


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

    image = _prefer_image(
        _meta_content(html, "og:image") or _meta_content(html, "twitter:image")
    )
    description = _meta_content(html, "og:description") or _meta_content(html, "description")
    if description:
        description = unescape(re.sub(r"\s+", " ", description)).strip()

    # 1) JSON-LD / meta product  2) preço embutido no título (comum no share do ML)
    price = (
        _json_ld_price(html)
        or _meta_content(html, "product:price:amount")
        or _extract_price_from_text(name, description)
    )
    if price and not str(price).upper().startswith("R$"):
        # meta product:price:amount às vezes vem só o número
        amount_meta = _meta_content(html, "product:price:amount")
        if amount_meta and str(price) == amount_meta:
            price = _format_brl(price)

    if name:
        name = _strip_price_from_text(name)
    if description:
        description = _strip_price_from_text(description)

    note = None
    if not name and not image:
        note = "Não foi possível extrair metadados automaticamente. Preencha manualmente."
    elif not price:
        note = "Nome/imagem ok, mas o preço não veio separado — confira e ajuste se precisar."

    return {
        "name": name,
        "price": price,
        "image": image,
        "description": description,
        "affiliate_url": cleaned,
        "resolved_url": resolved,
        "note": note,
    }
