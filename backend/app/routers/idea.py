import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import IdeaCard, StartupProfile
from app.schemas import IdeaGenerateRequest, IdeaGenerateResponse
from app.services import pipeline, web_client

router = APIRouter(prefix="/idea", tags=["idea"])

SYNTHESIS_SYSTEM_PROMPT = """You are a startup ideation assistant. Given a \
founder's domain/interests and raw web signal (trending discussions, recent \
news), produce 3-5 idea cards as a JSON array. Each item: {problem, solution, \
why_now, business_model, source_citations: [urls actually used]}. Ground each \
"why_now" in something from the provided signal, don't invent trends. Respond \
with a JSON array only, no markdown fences."""


@router.post("/generate", response_model=IdeaGenerateResponse)
def generate_ideas(payload: IdeaGenerateRequest, db: Session = Depends(get_db)):
    profile = db.get(StartupProfile, payload.profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")

    domain = payload.domain or profile.domain
    if not domain:
        raise HTTPException(status_code=400, detail="domain is required (either on the request or the profile)")

    query = f"{domain} trends discussions problems 2026"
    if payload.interests:
        query += f" {payload.interests}"

    # 1. gather
    serp_raw = pipeline.cached_fetch(
        db,
        tool_name="search_engine",
        query=query,
        fetch_fn=lambda: web_client.search_engine(query),
    )

    # 2. extract
    facts = pipeline.extract_facts(
        raw_context=json.dumps(serp_raw)[:8000],
        extraction_prompt=f"Extract recurring pain points, trends, and unmet needs in: {domain}",
    )

    # 3. synthesize
    synthesis = pipeline.synthesize(
        system_prompt=SYNTHESIS_SYSTEM_PROMPT,
        user_prompt=(
            f"Domain: {domain}\nInterests: {payload.interests or 'n/a'}\n"
            f"Clarifying answers: {payload.answers_to_clarifying_questions or 'n/a'}\n\n"
            f"Extracted signal:\n{json.dumps(facts)}"
        ),
    )
    try:
        cards_data = json.loads(synthesis)
    except ValueError:
        cards_data = []

    profile.domain = domain
    cards = []
    for card in cards_data:
        idea_card = IdeaCard(
            profile_id=profile.id,
            problem=card.get("problem", ""),
            solution=card.get("solution", ""),
            why_now=card.get("why_now", ""),
            business_model=card.get("business_model", ""),
            source_citations=card.get("source_citations", []),
        )
        db.add(idea_card)
        cards.append(idea_card)
    db.commit()
    for card in cards:
        db.refresh(card)
    return IdeaGenerateResponse(idea_cards=cards)
