import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"

INCIDENTS_FILE = DATA_DIR / "incidents.csv"
KNOWLEDGE_BASE_FILE = DATA_DIR / "knowledge_base.json"
MODEL_FILE = MODEL_DIR / "intent_model.pkl"

CONFIDENCE_THRESHOLD = 0.30

# ── RAG Configuration ──
CHROMA_DB_DIR = DATA_DIR / "chroma_db"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
RAG_TOP_K = 3

# ── Gemini Configuration ──
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-2.0-flash"