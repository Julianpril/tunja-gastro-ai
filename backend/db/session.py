from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Database URL
# Assuming PostgreSQL based on requirements.txt and user input
# User: postgres (default), Password: 2502, DB: gastronomicAI
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:2502@localhost/gastronomicAI"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
