from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from backend.app.core.config import settings

# Create a SQLAlchemy engine instance.
# The connect_args are specific to SQLite to allow for a single connection
# and disable same-thread checking, which is useful for FastAPI background tasks or specific test setups.
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL.lower() else {}
)

# Create a SessionLocal class. Instances of this class will be actual database sessions.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class. All database models will inherit from this class.
Base = declarative_base()

# Dependency to get a DB session in FastAPI routes
def get_db():
    """FastAPI dependency that provides a database session for a single request.
    Ensures the session is closed after the request is finished.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
