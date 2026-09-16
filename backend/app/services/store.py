"""
Lightweight, dependency-free event log.

Everything the agent does gets appended to a CSV so the ops dashboard has
something real to read. No database to run — the files live next to the
knowledge base and can be opened in Excel.
"""

import csv
import json
import threading
from datetime import datetime, timezone
from pathlib import Path

from app.config import LOG_DIR

_lock = threading.Lock()

RESOLUTIONS = LOG_DIR / "resolutions.csv"
FEEDBACK = LOG_DIR / "feedback.csv"
TICKETS = LOG_DIR / "tickets.csv"

_HEADERS = {
    RESOLUTIONS: [
        "at", "conversation_id", "user_name", "incident_text", "status",
        "intent", "confidence", "top_article", "top_similarity", "mood", "escalation_reason",
    ],
    FEEDBACK: ["at", "conversation_id", "helpful", "intent", "confidence", "comment"],
    TICKETS: ["at", "ticket_ref", "user_name", "email", "priority", "intent", "incident_text", "state"],
}


def _ensure(path: Path):
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    if not path.exists():
        with path.open("w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(_HEADERS[path])


def _append(path: Path, row: dict):
    with _lock:
        _ensure(path)
        with path.open("a", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=_HEADERS[path], extrasaction="ignore")
            writer.writerow({**{k: "" for k in _HEADERS[path]}, **row})


def _read(path: Path) -> list[dict]:
    with _lock:
        if not path.exists():
            return []
        with path.open("r", newline="", encoding="utf-8") as f:
            return list(csv.DictReader(f))


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


# ── Writers ────────────────────────────────────────────────────────────

def log_resolution(result: dict, conversation_id: str = ""):
    articles = result.get("retrieved_articles") or []
    top = articles[0] if articles else {}
    _append(RESOLUTIONS, {
        "at": _now(),
        "conversation_id": conversation_id,
        "user_name": result.get("user_name", ""),
        "incident_text": (result.get("incident_text") or "")[:500],
        "status": result.get("status", ""),
        "intent": result.get("predicted_intent") or "",
        "confidence": result.get("confidence") or 0,
        "top_article": top.get("title", ""),
        "top_similarity": top.get("similarity", ""),
        "mood": result.get("mood", ""),
        "escalation_reason": result.get("escalation_reason") or "",
    })


def log_feedback(helpful: bool, conversation_id: str = "", intent: str = "",
                 confidence: float | None = None, comment: str = ""):
    _append(FEEDBACK, {
        "at": _now(),
        "conversation_id": conversation_id,
        "helpful": "yes" if helpful else "no",
        "intent": intent or "",
        "confidence": confidence if confidence is not None else "",
        "comment": (comment or "")[:500],
    })


def next_ticket_ref() -> str:
    """Human-readable, sequential-ish reference. e.g. CS-4831."""
    existing = _read(TICKETS)
    return f"CS-{4000 + len(existing) + 1}"


def log_ticket(ticket_ref: str, user_name: str, email: str, priority: str,
               intent: str, incident_text: str):
    _append(TICKETS, {
        "at": _now(),
        "ticket_ref": ticket_ref,
        "user_name": user_name,
        "email": email,
        "priority": priority,
        "intent": intent or "",
        "incident_text": (incident_text or "")[:500],
        "state": "waiting on an agent",
    })


# ── Reader / aggregation ───────────────────────────────────────────────

def _f(value, default=0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def stats() -> dict:
    rows = _read(RESOLUTIONS)
    votes = _read(FEEDBACK)
    tickets = _read(TICKETS)

    total = len(rows)
    resolved = sum(1 for r in rows if r["status"] == "resolved")
    confidences = [_f(r["confidence"]) for r in rows if r["confidence"]]

    by_intent: dict[str, dict] = {}
    for r in rows:
        key = r["intent"] or "unknown"
        slot = by_intent.setdefault(key, {"intent": key, "count": 0, "resolved": 0, "confidence_sum": 0.0})
        slot["count"] += 1
        slot["resolved"] += 1 if r["status"] == "resolved" else 0
        slot["confidence_sum"] += _f(r["confidence"])

    intents = sorted(
        (
            {
                "intent": v["intent"],
                "count": v["count"],
                "resolved": v["resolved"],
                "avg_confidence": round(v["confidence_sum"] / v["count"], 2) if v["count"] else 0,
            }
            for v in by_intent.values()
        ),
        key=lambda x: -x["count"],
    )

    # Questions that only just cleared the bar — these are where the
    # knowledge base is thin, and the best place to write a new article.
    borderline = sorted(
        [
            {
                "incident_text": r["incident_text"],
                "intent": r["intent"],
                "confidence": _f(r["confidence"]),
                "status": r["status"],
            }
            for r in rows
            if 0 < _f(r["confidence"]) < 0.45
        ],
        key=lambda x: x["confidence"],
    )[:8]

    helpful = sum(1 for v in votes if v["helpful"] == "yes")

    return {
        "total": total,
        "resolved": resolved,
        "escalated": total - resolved,
        "resolution_rate": round(resolved / total, 3) if total else 0,
        "avg_confidence": round(sum(confidences) / len(confidences), 3) if confidences else 0,
        "feedback_count": len(votes),
        "helpful_rate": round(helpful / len(votes), 3) if votes else 0,
        "open_tickets": sum(1 for t in tickets if t["state"] != "closed"),
        "by_intent": intents,
        "needs_an_article": borderline,
    }


def load_knowledge(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)