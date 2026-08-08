import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class StartupProfile(Base):
    __tablename__ = "startup_profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    owner_id: Mapped[str] = mapped_column(String, index=True)
    domain: Mapped[str | None] = mapped_column(String, nullable=True)
    idea_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    stage: Mapped[str | None] = mapped_column(String, nullable=True)
    target_market: Mapped[str | None] = mapped_column(String, nullable=True)
    founder_skills: Mapped[dict] = mapped_column(JSON, default=dict)
    time_commitment: Mapped[str | None] = mapped_column(String, nullable=True)
    budget: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    idea_cards: Mapped[list["IdeaCard"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    market_reports: Mapped[list["MarketReport"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    cofounder_matches: Mapped[list["CofounderMatch"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    investor_leads: Mapped[list["InvestorLead"]] = relationship(back_populates="profile", cascade="all, delete-orphan")


class IdeaCard(Base):
    __tablename__ = "idea_cards"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    profile_id: Mapped[str] = mapped_column(ForeignKey("startup_profiles.id"), index=True)
    problem: Mapped[str] = mapped_column(Text)
    solution: Mapped[str] = mapped_column(Text)
    why_now: Mapped[str] = mapped_column(Text)
    business_model: Mapped[str] = mapped_column(Text)
    source_citations: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    profile: Mapped[StartupProfile] = relationship(back_populates="idea_cards")


class MarketReport(Base):
    __tablename__ = "market_reports"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    profile_id: Mapped[str] = mapped_column(ForeignKey("startup_profiles.id"), index=True)
    tam: Mapped[str | None] = mapped_column(String, nullable=True)
    sam: Mapped[str | None] = mapped_column(String, nullable=True)
    som: Mapped[str | None] = mapped_column(String, nullable=True)
    methodology_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    competitors: Mapped[list] = mapped_column(JSON, default=list)
    kpis: Mapped[list] = mapped_column(JSON, default=list)
    source_citations: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    profile: Mapped[StartupProfile] = relationship(back_populates="market_reports")


class CofounderMatch(Base):
    __tablename__ = "cofounder_matches"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    profile_id: Mapped[str] = mapped_column(ForeignKey("startup_profiles.id"), index=True)
    name: Mapped[str] = mapped_column(String)
    headline: Mapped[str | None] = mapped_column(String, nullable=True)
    profile_url: Mapped[str | None] = mapped_column(String, nullable=True)
    match_rationale: Mapped[str] = mapped_column(Text)
    skill_tags: Mapped[list] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    profile: Mapped[StartupProfile] = relationship(back_populates="cofounder_matches")


class InvestorLead(Base):
    __tablename__ = "investor_leads"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    profile_id: Mapped[str] = mapped_column(ForeignKey("startup_profiles.id"), index=True)
    firm: Mapped[str] = mapped_column(String)
    person: Mapped[str | None] = mapped_column(String, nullable=True)
    thesis_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    portfolio_highlights: Mapped[list] = mapped_column(JSON, default=list)
    outreach_angle: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_url: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    profile: Mapped[StartupProfile] = relationship(back_populates="investor_leads")


class ScrapeCache(Base):
    __tablename__ = "scrape_cache"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    cache_key: Mapped[str] = mapped_column(String, unique=True, index=True)
    tool_name: Mapped[str] = mapped_column(String)
    raw_response: Mapped[dict] = mapped_column(JSON)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
