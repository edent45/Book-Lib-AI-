"""Looks up the books of a series. Open Library has no series data, so Wikidata is used."""
import re
import httpx

WIKIDATA = "https://www.wikidata.org/w/api.php"
HEADERS = {"User-Agent": "BookLibAI/1.0 (https://github.com/edent45/Book-Lib-AI-; personal book tracker) httpx"}
SERIES_DESC = re.compile(r"\b(series|saga|trilogy|tetralogy|quartet|cycle|sequence)\b", re.I)
BOOK_DESC = re.compile(r"\b(book|novel|fantasy|fiction|literary|literature|comic|manga)", re.I)
PARTS = "P527"      # has part(s)
PART_OF = "P179"    # part of the series
ORDINAL = "P1545"   # series ordinal


def _ordinal(claims: dict) -> int | None:
    # Whole-number ordinals only: this skips prequel stories like "0.5"
    for c in claims.get(PART_OF, []):
        for q in c.get("qualifiers", {}).get(ORDINAL, []):
            value = q.get("datavalue", {}).get("value")
            if isinstance(value, str) and value.isdigit():
                return int(value)
    return None


def _part_ids(claims: dict) -> list[str]:
    return [
        c["mainsnak"]["datavalue"]["value"]["id"]
        for c in claims.get(PARTS, [])
        if "datavalue" in c["mainsnak"]
    ]


async def lookup_series_parts(title: str) -> list[dict] | None:
    """Returns [{"position": 1, "title": "..."}, ...] ordered by position, or None."""
    async with httpx.AsyncClient(timeout=10, headers=HEADERS) as client:
        res = await client.get(WIKIDATA, params={
            "action": "wbsearchentities", "search": title, "language": "en",
            "type": "item", "format": "json", "limit": 8,
        })
        res.raise_for_status()
        candidates = [
            hit["id"] for hit in res.json().get("search", [])
            if SERIES_DESC.search(hit.get("description", "")) and BOOK_DESC.search(hit.get("description", ""))
        ][:5]
        if not candidates:
            return None

        res = await client.get(WIKIDATA, params={
            "action": "wbgetentities", "ids": "|".join(candidates), "props": "claims", "format": "json",
        })
        res.raise_for_status()
        series_entities = res.json().get("entities", {})

        for qid in candidates:
            part_ids = _part_ids(series_entities.get(qid, {}).get("claims", {}))
            if not part_ids:
                continue
            res = await client.get(WIKIDATA, params={
                "action": "wbgetentities", "ids": "|".join(part_ids[:50]),
                "props": "claims|labels", "languages": "en", "format": "json",
            })
            res.raise_for_status()
            parts_by_position: dict[int, str] = {}
            for entity in res.json().get("entities", {}).values():
                position = _ordinal(entity.get("claims", {}))
                label = entity.get("labels", {}).get("en", {}).get("value")
                if position is not None and label:
                    parts_by_position.setdefault(position, label)
            if parts_by_position:
                return [{"position": p, "title": t} for p, t in sorted(parts_by_position.items())]
    return None
