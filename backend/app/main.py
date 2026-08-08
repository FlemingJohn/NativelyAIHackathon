from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import Base, engine
from app.routers import cofounder, idea, investor, market, profile

Base.metadata.create_all(bind=engine)

app = FastAPI(title="One Place for Startups")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router)
app.include_router(idea.router)
app.include_router(market.router)
app.include_router(cofounder.router)
app.include_router(investor.router)


@app.get("/health")
def health():
    return {"status": "ok"}
