from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field

# ── Conversation ───────────────────────────────────────────────────────

class Turn(BaseModel):
    """One earlier message, so follow-up questions make sense."""
    role: Literal["customer", "agent"]
    text: str


class IncidentRequest(BaseModel):
    incident_text: str = Field(..., min_length=3, max_length=4000)
    user_name: Optional[str] = Field("Customer", max_length=100)
    conversation_id: Optional[str] = ""
    preferred_language: Optional[str] = "auto"
    language: Optional[str] = "English"
    history: list[Turn] = Field(default_factory=list)


class RetrievedArticle(BaseModel):
    id: Optional[str] = None
    title: str
    category: str
    similarity: float


class ResolutionResponse(BaseModel):
    status: Literal["resolved", "escalated"]
    incident_text: str
    user_name: str = "Customer"
    language: str = "English"
    predicted_intent: str | None = None
    confidence: float | None = None
    knowledge_title: str | None = None
    response: str
    retrieved_articles: list[RetrievedArticle] | None = None
    rag_enabled: bool = True

    mood: Literal["calm", "frustrated", "urgent"] = "calm"
    escalation_reason: str | None = None
    follow_up: bool = False
    suggested_replies: list[str] = Field(default_factory=list)


# ── Knowledge ──────────────────────────────────────────────────────────

class Article(BaseModel):
    id: str
    title: str
    category: str
    content: str


# ── Feedback ───────────────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    helpful: bool
    conversation_id: Optional[str] = ""
    incident_text: Optional[str] = ""
    predicted_intent: Optional[str] = ""
    confidence: Optional[float] = None
    comment: Optional[str] = ""


class Ack(BaseModel):
    ok: bool = True
    message: str


# ── Escalation ─────────────────────────────────────────────────────────

class EscalationRequest(BaseModel):
    user_name: str = Field("Customer", max_length=100)
    email: EmailStr
    incident_text: str = Field(..., min_length=3)
    predicted_intent: Optional[str] = ""
    priority: Literal["normal", "urgent"] = "normal"
    conversation_id: Optional[str] = ""


class EscalationResponse(BaseModel):
    ticket_ref: str
    message: str
    expect_reply_within_hours: int


# ── Languages ──────────────────────────────────────────────────────────

class Language(BaseModel):
    code: str
    name: str


# ── Ops ────────────────────────────────────────────────────────────────

class IntentStat(BaseModel):
    intent: str
    count: int
    resolved: int
    avg_confidence: float


class GapRow(BaseModel):
    incident_text: str
    intent: str
    confidence: float
    status: str


class StatsResponse(BaseModel):
    total: int
    resolved: int
    escalated: int
    resolution_rate: float
    avg_confidence: float
    feedback_count: int
    helpful_rate: float
    open_tickets: int
    by_intent: list[IntentStat]
    needs_an_article: list[GapRow]


class Health(BaseModel):
    ok: bool
    message: str
    llm_connected: bool
    articles_indexed: int