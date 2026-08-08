"""Shared gather -> extract -> synthesize pipeline used by all four modules.

1. gather: call Bright Data (through cached_fetch, so repeat demo runs don't
   burn credits) to get raw web data.
2. extract: cheap AIML model turns raw data into structured facts.
3. synthesize: reasoning AIML model turns structured facts + profile context
   into the module's final output.
"""

import hashlib
import json
from collections.abc import Callable
from typing import Any

from sqlalchemy.orm import Session

from app.models import ScrapeCache
from app.services import aiml_client


def _cache_key(tool_name: str, query: str) -> str:
    return hashlib.sha256(f"{tool_name}:{query}".encode()).hexdigest()


def cached_fetch(db: Session, *, tool_name: str, query: str, fetch_fn: Callable[[], Any]) -> Any:
    """Look up (tool_name, query) in ScrapeCache; call fetch_fn and store on miss."""
    key = _cache_key(tool_name, query)
    cached = db.query(ScrapeCache).filter_by(cache_key=key).first()
    if cached:
        return cached.raw_response

    result = fetch_fn()
    payload = result if isinstance(result, (dict, list)) else {"raw": result}
    db.add(ScrapeCache(cache_key=key, tool_name=tool_name, raw_response=payload))
    db.commit()
    return payload


def extract_facts(raw_context: str, extraction_prompt: str) -> dict:
    """Cheap-model pass: raw scraped text -> structured JSON facts."""
    content = aiml_client.chat(
        [
            {"role": "system", "content": "Extract structured facts as compact JSON. Respond with JSON only."},
            {"role": "user", "content": f"{extraction_prompt}\n\n---\n{raw_context}"},
        ],
        reasoning=False,
    )
    try:
        return json.loads(content)
    except ValueError:
        return {"raw": content}


def synthesize(system_prompt: str, user_prompt: str) -> str:
    """Reasoning-model pass: structured facts + profile context -> final output."""
    return aiml_client.chat(
        [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        reasoning=True,
    )
