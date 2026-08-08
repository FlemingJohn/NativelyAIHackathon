from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StartupProfileCreate(BaseModel):
    owner_id: str
    domain: str | None = None
    idea_text: str | None = None
    stage: str | None = None
    target_market: str | None = None
    founder_skills: dict = {}
    time_commitment: str | None = None
    budget: str | None = None


class StartupProfileUpdate(BaseModel):
    domain: str | None = None
    idea_text: str | None = None
    stage: str | None = None
    target_market: str | None = None
    founder_skills: dict | None = None
    time_commitment: str | None = None
    budget: str | None = None


class StartupProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    owner_id: str
    domain: str | None
    idea_text: str | None
    stage: str | None
    target_market: str | None
    founder_skills: dict
    time_commitment: str | None
    budget: str | None
    created_at: datetime
    updated_at: datetime


class IdeaGenerateRequest(BaseModel):
    profile_id: str
    domain: str | None = None
    interests: str | None = None
    answers_to_clarifying_questions: str | None = None


class IdeaCardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    problem: str
    solution: str
    why_now: str
    business_model: str
    source_citations: list


class IdeaGenerateResponse(BaseModel):
    idea_cards: list[IdeaCardOut]


class MarketResearchRequest(BaseModel):
    profile_id: str
    idea_text: str


class MarketReportOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    tam: str | None
    sam: str | None
    som: str | None
    methodology_notes: str | None
    competitors: list
    kpis: list
    source_citations: list


class MarketResearchResponse(BaseModel):
    market_report: MarketReportOut


class CofounderSearchRequest(BaseModel):
    profile_id: str
    founder_profile: dict
    desired_complement: str


class CofounderMatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    headline: str | None
    profile_url: str | None
    match_rationale: str
    skill_tags: list


class CofounderSearchResponse(BaseModel):
    matches: list[CofounderMatchOut]


class InvestorSearchRequest(BaseModel):
    profile_id: str


class InvestorLeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    firm: str
    person: str | None
    thesis_summary: str | None
    portfolio_highlights: list
    outreach_angle: str | None
    source_url: str | None


class InvestorSearchResponse(BaseModel):
    leads: list[InvestorLeadOut]
