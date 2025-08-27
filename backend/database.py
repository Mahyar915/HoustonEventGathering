from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite database URL
import os

# Get the absolute path to the project root
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'event_registrations.db')}"
print(f"Database URL: {DATABASE_URL}")

# Create a SQLAlchemy engine
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# Create a declarative base
Base = declarative_base()

# Create database tables (imported models will be registered with Base)
# This line will be called after models are imported

# Create a sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

