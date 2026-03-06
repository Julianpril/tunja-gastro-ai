"""
Centralized configuration — reads all secrets from .env file.
"""
import os
from dotenv import load_dotenv

# Load .env from project root (two levels up from backend/core/)
_env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
load_dotenv(dotenv_path=_env_path)

# ─── API Keys ──────────────────────────────────────────────
OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

# ─── JWT / Auth ────────────────────────────────────────────
SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

# ─── Database ──────────────────────────────────────────────
DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:2502@localhost/gastronomicAI")
