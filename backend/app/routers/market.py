import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import MarketReport, StartupProfile
from app.schemas import MarketResearchRequest, MarketResearchResponse
from app.services import pipeline, web_client

router = APIRouter(prefix="/market", tags=["market"])

SYNTHESIS_SYSTEM_PROMPT = """You are a startup market analyst. Given raw web \
research (search snippets and competitor page excerpts) about a startup idea, \
produce a market report as JSON with exactly these keys:
tam, sam, som (each a string estimate + one-line method note),
competitors (array of {name, summary, url}),
kpis (array of {name, why_it_matters}, chosen for this specific business model),
methodology_notes (string),
source_citations (array of urls actually used).
Respond with JSON only, no markdown fences."""


@router.post("/research", response_model=MarketResearchResponse)
def research_market(payload: MarketResearchRequest, db: Session = Depends(get_db)):
    profile = db.get(StartupProfile, payload.profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")

    # 1. gather (cached so repeat demo runs don't re-spend Bright Data credits)
    serp_raw = pipeline.cached_fetch(
        db,
        tool_name="search_engine",
        query=f"competitors AND market size: {payload.idea_text}",
        fetch_fn=lambda: web_client.search_engine(f"competitors and market size for: {payload.idea_text}"),
    )

    # 2. extract
    facts = pipeline.extract_facts(
        raw_context=json.dumps(serp_raw)[:8000],
        extraction_prompt=f"Extract competitor names, pricing signals, and market-size mentions relevant to: {payload.idea_text}",
    )

    # 3. synthesize
    synthesis = pipeline.synthesize(
        system_prompt=SYNTHESIS_SYSTEM_PROMPT,
        user_prompt=f"Startup idea: {payload.idea_text}\n\nExtracted facts:\n{json.dumps(facts)}",
    )
    try:
        report_data = json.loads(synthesis)
    except ValueError:
        report_data = {
            "tam": None, "sam": None, "som": None,
            "competitors": [], "kpis": [],
            "methodology_notes": synthesis, "source_citations": [],
        }

    profile.idea_text = payload.idea_text
    report = MarketReport(
        profile_id=profile.id,
        tam=report_data.get("tam"),
        sam=report_data.get("sam"),
        som=report_data.get("som"),
        methodology_notes=report_data.get("methodology_notes"),
        competitors=report_data.get("competitors", []),
        kpis=report_data.get("kpis", []),
        source_citations=report_data.get("source_citations", []),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return MarketResearchResponse(market_report=report)
