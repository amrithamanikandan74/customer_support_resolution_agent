import json

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.config import (
    AGENT_NAME,
    CORS_ORIGINS,
    KNOWLEDGE_BASE_FILE,
    LANGUAGE_NAMES,
    SUPPORTED_LANGUAGES,
)
from app.schemas import (
    Ack,
    Article,
    EscalationRequest,
    EscalationResponse,
    FeedbackRequest,
    Health,
    IncidentRequest,
    Language,
    ResolutionResponse,
    StatsResponse,
)
from app.services import store
from app.services.resolution_orchestrator import ResolutionOrchestrator

app = FastAPI(
    title="Customer Support Resolution Agent",
    description="Retrieval-grounded support agent with escalation, feedback and ops endpoints.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

orchestrator = ResolutionOrchestrator()


def _knowledge() -> list[dict]:
    return store.load_knowledge(KNOWLEDGE_BASE_FILE)


# ── Health ─────────────────────────────────────────────────────────────

@app.get("/", response_model=Health)
def root():
    return Health(
        ok=True,
        message=f"{AGENT_NAME} is on the desk",
        llm_connected=orchestrator.response_generator.connected,
        articles_indexed=orchestrator.rag_retriever.collection.count(),
    )


# ── Resolving ──────────────────────────────────────────────────────────

@app.post("/resolve", response_model=ResolutionResponse)
def resolve_incident(request: IncidentRequest):
    return orchestrator.resolve(
        incident_text=request.incident_text,
        user_name=request.user_name or "Customer",
        history=[t.model_dump() for t in request.history],
        conversation_id=request.conversation_id or "",
        preferred_language=request.preferred_language or "auto",
    )


@app.get("/languages", response_model=list[Language])
def languages():
    return SUPPORTED_LANGUAGES


@app.post("/resolve/stream")
def resolve_incident_stream(request: IncidentRequest):
    """
    Same pipeline, delivered as server-sent events.

    Events, in order:
      meta  — intent, confidence, matched articles, status. Arrives immediately,
              so the UI can show the reasoning while the reply is still being written.
      token — a chunk of the reply text.
      done  — the assembled reply, for logging and copy-to-clipboard.
    """
    history = [t.model_dump() for t in request.history]
    user_name = request.user_name or "Customer"
    text = request.incident_text
    preferred_language = request.preferred_language or "auto"

    def events():
        a = orchestrator.assess(text, history, preferred_language)
        status = "escalated" if (not a["is_greeting"] and a["escalation_reason"]) else "resolved"
        articles = orchestrator._summarise(a["articles"])

        # NOTE: this initial meta event is sent before the reply is generated,
        # so it deliberately omits "language" — the requested language isn't
        # necessarily the one that gets delivered (Gemini may be unreachable,
        # in which case the offline fallback answers in English regardless of
        # what was asked for). The authoritative language comes back with the
        # "done" event below, once generation has actually happened.
        meta = {
            "status": status,
            "predicted_intent": a["intent"],
            "confidence": a["confidence"],
            "retrieved_articles": articles,
            "knowledge_title": a["articles"][0]["title"] if (a["articles"] and status == "resolved" and not a["is_greeting"]) else None,
            "mood": a["mood"],
            "escalation_reason": a["escalation_reason"],
            "follow_up": a["is_follow_up"],
            "suggested_replies": [] if a["is_greeting"] else orchestrator._suggestions(status, a["intent"]),
        }
        yield f"event: meta\ndata: {json.dumps(meta)}\n\n"

        parts: list[str] = []
        if a["is_greeting"]:
            reply, actual_language = orchestrator.response_generator.greet(user_name, a["language"])
            parts.append(reply)
            yield f"event: token\ndata: {json.dumps(reply)}\n\n"
        elif status == "escalated":
            reply, actual_language = orchestrator.response_generator.generate_escalation(
                incident_text=text,
                confidence=a["confidence"],
                user_name=user_name,
                retrieved_articles=a["articles"],
                reason=a["escalation_reason"],
                mood=a["mood"],
                history=history,
                language=a["language"],
            )
            parts.append(reply)
            yield f"event: token\ndata: {json.dumps(reply)}\n\n"
        else:
            report: dict = {}
            for chunk in orchestrator.response_generator.stream(
                incident_text=text,
                intent=a["intent"],
                retrieved_articles=a["articles"],
                user_name=user_name,
                mood=a["mood"],
                history=history,
                is_follow_up=a["is_follow_up"],
                language=a["language"],
                report=report,
            ):
                parts.append(chunk)
                yield f"event: token\ndata: {json.dumps(chunk)}\n\n"
            actual_language = report.get("language", "en")

        full = "".join(parts).strip()
        language_name = LANGUAGE_NAMES.get(actual_language, actual_language)
        result = {
            **meta,
            "incident_text": text,
            "user_name": user_name,
            "response": full,
            "rag_enabled": True,
            "language": language_name,
        }
        store.log_resolution(result, request.conversation_id or "")
        yield f"event: done\ndata: {json.dumps({'response': full, 'language': language_name})}\n\n"

    return StreamingResponse(
        events(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Knowledge ──────────────────────────────────────────────────────────

@app.get("/knowledge", response_model=list[Article])
def knowledge():
    return _knowledge()


@app.get("/knowledge/{article_id}", response_model=Article)
def knowledge_article(article_id: str):
    for a in _knowledge():
        if a["id"] == article_id:
            return a
    raise HTTPException(status_code=404, detail="No article with that id")


# ── Feedback ───────────────────────────────────────────────────────────

@app.post("/feedback", response_model=Ack)
def feedback(request: FeedbackRequest):
    store.log_feedback(
        helpful=request.helpful,
        conversation_id=request.conversation_id or "",
        intent=request.predicted_intent or "",
        confidence=request.confidence,
        comment=request.comment or "",
    )
    return Ack(
        message="Thanks — noted."
        if request.helpful
        else "Noted. That answer gets flagged for review."
    )


# ── Escalation ─────────────────────────────────────────────────────────

@app.post("/escalate", response_model=EscalationResponse)
def escalate(request: EscalationRequest):
    ref = store.create_ticket(
        user_name=request.user_name,
        email=str(request.email),
        priority=request.priority,
        intent=request.predicted_intent or "",
        incident_text=request.incident_text,
    )
    hours = 4 if request.priority == "urgent" else 24
    return EscalationResponse(
        ticket_ref=ref,
        message=(
            f"That's with a colleague now, under {ref}. They'll reply to "
            f"{request.email} within {hours} hours."
        ),
        expect_reply_within_hours=hours,
    )


# ── Ops ────────────────────────────────────────────────────────────────

@app.get("/stats", response_model=StatsResponse)
def stats():
    return store.stats()