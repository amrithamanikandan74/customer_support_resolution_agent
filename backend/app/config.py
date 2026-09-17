import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"
LOG_DIR = BASE_DIR / "logs"

INCIDENTS_FILE = DATA_DIR / "incidents.csv"
KNOWLEDGE_BASE_FILE = DATA_DIR / "knowledge_base.json"
MODEL_FILE = MODEL_DIR / "intent_model.pkl"

CONFIDENCE_THRESHOLD = 0.25

# ── RAG Configuration ──
CHROMA_DB_DIR = DATA_DIR / "chroma_db"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
RAG_TOP_K = 3

# A retrieval score this low means the knowledge base simply has nothing
# on the subject, whatever the intent classifier thinks.
MIN_ARTICLE_SIMILARITY = 0.30

# ── Gemini Configuration ──
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")

# ── CORS ──
# Comma-separated list of origins allowed to call this API, e.g.
#   CORS_ORIGINS=https://myapp.com,https://staging.myapp.com
# Defaults to the Vite dev server on localhost/127.0.0.1 so local development
# keeps working out of the box. Never falls back to "*" — a wildcard origin
# combined with credentialed requests isn't actually spec-legal in browsers,
# and it would let any site call this API on a visitor's behalf.
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

# ── The agent's identity ──
# Support feels human when it comes from someone, not from "the system".
AGENT_NAME = os.getenv("AGENT_NAME", "Maya")
AGENT_TEAM = os.getenv("AGENT_TEAM", "the support desk")

# ── Languages ──
# "auto" means: reply in whatever language the customer wrote in.
# Anything else pins the reply to that language regardless of input.
SUPPORTED_LANGUAGES = [
    {"code": "auto", "name": "Match my message"},
    {"code": "en", "name": "English"},
    {"code": "hi", "name": "Hindi"},
    {"code": "ml", "name": "Malayalam"},
    {"code": "ta", "name": "Tamil"},
    {"code": "te", "name": "Telugu"},
    {"code": "kn", "name": "Kannada"},
    {"code": "bn", "name": "Bengali"},
    {"code": "mr", "name": "Marathi"},
    {"code": "gu", "name": "Gujarati"},
    {"code": "pa", "name": "Punjabi"},
    {"code": "ur", "name": "Urdu"},
    {"code": "es", "name": "Spanish"},
    {"code": "fr", "name": "French"},
    {"code": "ar", "name": "Arabic"},
]
LANGUAGE_NAMES = {l["code"]: l["name"] for l in SUPPORTED_LANGUAGES}