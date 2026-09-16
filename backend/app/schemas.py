from pydantic import BaseModel, Field
from typing import Optional


class IncidentRequest(BaseModel):
    incident_text: str = Field(..., min_length=3)
    user_name: Optional[str] = "Customer"


class RetrievedArticle(BaseModel):
    title: str
    category: str
    similarity: float


class ResolutionResponse(BaseModel):
    status: str
    incident_text: str
    predicted_intent: str | None = None
    confidence: float | None = None
    knowledge_title: str | None = None
    response: str
    retrieved_articles: list[RetrievedArticle] | None = None
    rag_enabled: bool = False