import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import InvestorLead, MarketReport, StartupProfile
from app.schemas import InvestorSearchRequest, InvestorSearchResponse
from app.services import pipeline, web_client

router = APIRouter(prefix="/investor", tags=["investor"])

SYNTHESIS_SYSTEM_PROMPT = """You are an investor-matching assistant. Given a \
startup's domain, stage, and market size, plus raw web signal about VC firms \
and their theses/portfolios, produce a JSON array of up to 5 investor leads: \
{firm, person, thesis_summary, portfolio_highlights: [], outreach_angle, \
source_url}. outreach_angle must reference something real from the signal \
(a portfolio company, a stated thesis line), not a generic pitch. Respond \
with a JSON array only, no markdown fences."""


@router.post("/search", response_model=InvestorSearchResponse)
def search_investors(payload: InvestorSearchRequest, db: Session = Depends(get_db)):
    profile = db.get(StartupProfile, payload.profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")
    if not profile.domain:
        raise HTTPException(status_code=400, detail="profile has no domain yet -- run idea/market research first")

    latest_report = (
        db.query(MarketReport)
        .filter_by(profile_id=profile.id)
        .order_by(MarketReport.created_at.desc())
        .first()
    )
    stage = profile.stage or "early stage"
    query = f"VC investors funding {profile.domain} startups {stage}"

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
        extraction_prompt=f"Extract VC firm names, partners, and stated investment thesis for: {profile.domain}",
    )

    # 3. synthesize
    synthesis = pipeline.synthesize(
        system_prompt=SYNTHESIS_SYSTEM_PROMPT,
        user_prompt=(
            f"Domain: {profile.domain}\nStage: {stage}\n"
            f"TAM (if known): {latest_report.tam if latest_report else 'unknown'}\n\n"
            f"Investor signal:\n{json.dumps(facts)}"
        ),
    )
    try:
        leads_data = json.loads(synthesis)
    except ValueError:
        leads_data = []

    leads = []
    for lead in leads_data:
        investor_lead = InvestorLead(
            profile_id=profile.id,
            firm=lead.get("firm", ""),
            person=lead.get("person"),
            thesis_summary=lead.get("thesis_summary"),
            portfolio_highlights=lead.get("portfolio_highlights", []),
            outreach_angle=lead.get("outreach_angle"),
            source_url=lead.get("source_url"),
        )
        db.add(investor_lead)
        leads.append(investor_lead)
    db.commit()
    for lead in leads:
        db.refresh(lead)
    return InvestorSearchResponse(leads=leads)
