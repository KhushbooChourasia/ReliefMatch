"""
main.py
FastAPI application entry point.

Run with:
    uvicorn main:app --reload
Then open http://127.0.0.1:8000/docs for interactive API docs.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import tasks, volunteers, assignment

# Creates tables if they don't exist yet. Fine for SQLite/dev; for Postgres
# in a real deployment you'd normally use Alembic migrations instead.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ReliefMatch API",
    description="AI + Quantum-assisted volunteer-to-task allocation for disaster relief.",
    version="0.1.0",
)

# Allow the React frontend (running on a different port during dev) to call this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your frontend's actual origin before deploying
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router)
app.include_router(volunteers.router)
app.include_router(assignment.router)


@app.get("/")
def root():
    return {"status": "ReliefMatch API is running", "docs": "/docs"}