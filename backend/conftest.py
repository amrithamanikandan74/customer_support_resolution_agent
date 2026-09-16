import sys
from pathlib import Path

# Add backend directory to sys.path so app modules can be imported in tests
sys.path.insert(0, str(Path(__file__).resolve().parent))
