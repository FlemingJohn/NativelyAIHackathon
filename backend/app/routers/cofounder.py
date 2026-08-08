import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import CofounderMatch, StartupProfile
from app.schemas import CofounderSearchRequest, CofounderSearchResponse
from app.services import pipeline, web_client

router = APIRouter(prefix="/cofounder", tags=["cofounder"])

SYNTHESIS_SYSTEM_PROMPT = """You are a cofounder-matching assistant. Given a \
founder's own profile, the complementary profile they're looking for, and raw \
candidate signal from the web, produce a JSON array of up to 5 candidates: \
{name, headline, profile_url, match_rationale, skill_tags: []}. \
match_rationale must explain the *complementary* fit (why this candidate \
covers what the founder is missing), not just similarity. Respond with a \
JSON array only, no markdown fences."""


def _gather_candidates(db: Session, domain: str, desired_complement: str) -> list[dict]:
    """Plain web search for now -- the richer LinkedIn people-search dataset
    tool (brightdata_client.run_dataset_tool) is on hold until Bright Data
    access is unblocked, see bright-data.md."""
    query = f"{desired_complement} cofounder {domain}"
    return pipeline.cached_fetch(
        db,
        tool_name="search_engine",
        query=query,
        fetch_fn=lambda: web_client.search_engine(query),
    )


@router.post("/search", response_model=CofounderSearchResponse)
def search_cofounders(payload: CofounderSearchRequest, db: Session = Depends(get_db)):
    profile = db.get(StartupProfile, payload.profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")

    # 1. gather
    raw = _gather_candidates(db, profile.domain or "startup", payload.desired_complement)

    # 2. extract
    facts = pipeline.extract_facts(
        raw_context=json.dumps(raw)[:8000],
        extraction_prompt=f"Extract candidate people (name, headline, profile url) matching: {payload.desired_complement}",
    )

    # 3. synthesize
    synthesis = pipeline.synthesize(
        system_prompt=SYNTHESIS_SYSTEM_PROMPT,
        user_prompt=(
            f"Founder profile: {json.dumps(payload.founder_profile)}\n"
            f"Looking for: {payload.desired_complement}\n\n"
            f"Candidate signal:\n{json.dumps(facts)}"
        ),
    )
    try:
        matches_data = json.loads(synthesis)
    except ValueError:
        matches_data = []

    profile.founder_skills = payload.founder_profile
    matches = []
    for m in matches_data:
        match = CofounderMatch(
            profile_id=profile.id,
            name=m.get("name", ""),
            headline=m.get("headline"),
            profile_url=m.get("profile_url"),
            match_rationale=m.get("match_rationale", ""),
            skill_tags=m.get("skill_tags", []),
        )
        db.add(match)
        matches.append(match)
    db.commit()
    for match in matches:
        db.refresh(match)
    return CofounderSearchResponse(matches=matches)
