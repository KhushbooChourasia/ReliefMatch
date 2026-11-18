"""
database.py
Sets up the SQLAlchemy engine, session, and declarative Base.

- Defaults to a local SQLite file (relief_match.db) so the team can run the
  backend with zero setup.
- Set DATABASE_URL in .env to switch to Postgres later, e.g.:
    DATABASE_URL=postgresql://user:password@localhost:5432/reliefmatch
  No other code changes are needed to switch databases.
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./relief_match.db")

# connect_args is only needed for SQLite (disables same-thread check so
# FastAPI's request-per-thread model works correctly).
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a DB session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()