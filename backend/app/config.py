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
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# ── The agent's identity ──
# Support feels human when it comes from someone, not from "the system".
AGENT_NAME = os.getenv("AGENT_NAME", "Maya")
AGENT_TEAM = os.getenv("AGENT_TEAM", "the support desk")