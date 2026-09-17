import re

from app.config import CONFIDENCE_THRESHOLD, LANGUAGE_NAMES, MIN_ARTICLE_SIMILARITY
from app.services import store
from app.services.intent_classifier import IntentClassifier
from app.services.rag_retriever import RAGRetriever
from app.services.response_generator import ResponseGenerator

try:
    from langdetect import DetectorFactory, detect
    DetectorFactory.seed = 0  # deterministic — same text always detects the same way
    _HAS_LANGDETECT = True
except ImportError:
    _HAS_LANGDETECT = False


# Wording the classifier's label should be backed up by. An intent that
# isn't listed here has no rule to break, so it passes on confidence alone
# rather than being escalated by default.
RCA_RULES = {
    "login_issue": ["login", "log in", "sign in", "signin", "cannot access", "can't get in"],
    "password_reset": ["password", "passcode", "reset", "forgot"],
    "payment_failed": ["payment", "paid", "charge", "charged", "deducted", "debited", "transaction", "card"],
    "refund_request": ["refund", "money back", "reimburse", "return"],
    "order_delay": ["order", "delivery", "deliver", "shipping", "parcel", "package", "late", "tracking"],
    "account_locked": ["lock", "locked", "blocked", "suspended", "disabled"],
    "technical_error": ["error", "crash", "crashed", "server", "500", "404", "bug", "broken", "won't load"],
    "subscription": ["subscription", "subscribe", "plan", "renew", "renewal", "auto-renew",
                     "cancel", "downgrade", "upgrade", "billing cycle", "monthly", "yearly"],
}

FRUSTRATION = [
    "ridiculous", "unacceptable", "worst", "terrible", "awful", "furious", "angry",
    "fed up", "third time", "again and again", "no one", "nobody", "still not",
    "useless", "disgusted", "complaint", "escalate", "scam", "cheated",
]

URGENCY = [
    "urgent", "asap", "immediately", "today", "right now", "emergency",
    "deadline", "flight", "tomorrow morning", "need this fixed", "stranded",
]


# A message this short and this plain isn't an issue to diagnose — it's someone
# saying hello. Answering it warmly instead of running it through the RCA
# pipeline stops "hi" or "hlo" from being escalated for having no content.
SMALL_TALK_WORDS = {
    "hi", "hii", "hiii", "hiya", "hey", "heya", "hello", "helo", "hllo", "hlo",
    "yo", "sup", "namaste", "vanakkam", "salaam", "hola", "bonjour",
    "test", "testing", "ok", "okay", "thanks", "thank", "you",
}


def is_small_talk(text: str) -> bool:
    t = re.sub(r"[!.?,]+$", "", text.strip().lower())
    if not t:
        return False
    words = t.split()
    return len(words) <= 3 and all(w in SMALL_TALK_WORDS for w in words)


def detect_language(text: str, preferred: str = "auto") -> str:
    """Return an ISO code. 'preferred' pins the reply; otherwise guess from the text."""
    if preferred and preferred != "auto":
        return preferred
    if not _HAS_LANGDETECT or len(text.strip()) < 4:
        return "en"
    try:
        code = detect(text)
        # langdetect's "zh-cn" etc. — keep only what we actually list, else fall back
        return code if code in LANGUAGE_NAMES else code.split("-")[0] if code.split("-")[0] in LANGUAGE_NAMES else "en"
    except Exception:
        return "en"


def read_mood(text: str) -> str:
    """A rough read on how the customer is feeling, used to set the reply's tone."""
    t = text.lower()
    if any(w in t for w in URGENCY):
        return "urgent"
    if any(w in t for w in FRUSTRATION) or text.count("!") >= 2 or (
        sum(1 for c in text if c.isupper()) > max(8, len(text) * 0.4)
    ):
        return "frustrated"
    return "calm"


class ResolutionOrchestrator:
    def __init__(self):
        self.intent_classifier = IntentClassifier()
        self.rag_retriever = RAGRetriever()
        self.response_generator = ResponseGenerator()

    # ── Guardrails ─────────────────────────────────────────────────────

    @staticmethod
    def validate_intent(intent: str, text: str) -> bool:
        """
        Does the customer's wording back up the label the classifier picked?

        An intent with no rule defined returns True — the confidence check is
        the only gate that applies to it. The original version returned False
        for anything unlisted, which escalated those cases no matter how
        confident the model was.
        """
        keywords = RCA_RULES.get(intent)
        if keywords is None:
            return True
        return any(k in text.lower() for k in keywords)

    # ── Shared pipeline up to the point of writing a reply ─────────────

    def assess(self, incident_text: str, history: list[dict] | None = None,
               preferred_language: str = "auto") -> dict:
        language = detect_language(incident_text, preferred_language)

        if not history and is_small_talk(incident_text):
            return {
                "intent": "greeting", "confidence": 1.0, "articles": [],
                "mood": "calm", "escalation_reason": None, "is_follow_up": False,
                "is_greeting": True, "language": language,
            }

        intent_result = self.intent_classifier.predict(incident_text)
        intent = intent_result["intent"]
        confidence = intent_result["confidence"]

        # A short follow-up ("did that work for anyone else?") carries little
        # signal on its own, so search with the previous message attached.
        query = incident_text
        if history and len(incident_text.split()) < 6:
            previous = [h["text"] for h in history if h["role"] == "customer"]
            if previous:
                query = f"{previous[-1]} {incident_text}"

        articles = self.rag_retriever.retrieve(query)
        best = articles[0]["similarity"] if articles else 0.0

        reason = None
        if confidence < CONFIDENCE_THRESHOLD:
            reason = "low_confidence"
        elif best < MIN_ARTICLE_SIMILARITY:
            reason = "no_matching_article"
        elif not self.validate_intent(intent, incident_text):
            reason = "wording_mismatch"

        return {
            "intent": intent,
            "confidence": confidence,
            "articles": articles,
            "mood": read_mood(incident_text),
            "escalation_reason": reason,
            "is_follow_up": bool(history),
            "is_greeting": False,
            "language": language,
        }

    @staticmethod
    def _summarise(articles: list[dict]) -> list[dict]:
        return [
            {
                "id": a.get("id"),
                "title": a["title"],
                "category": a["category"],
                "similarity": round(a["similarity"], 2),
            }
            for a in articles
        ]

    @staticmethod
    def _suggestions(status: str, intent: str) -> list[str]:
        if status == "escalated":
            return ["Put me through to a person", "Here's more detail"]
        return {
            "payment_failed": ["It's still showing today", "How do I get a receipt?"],
            "refund_request": ["How long will the refund take?", "It hasn't arrived yet"],
            "order_delay": ["Where is it right now?", "I'd like to cancel instead"],
            "login_issue": ["That didn't work", "Send me a reset link"],
            "account_locked": ["It's still locked", "I didn't try to log in"],
            "password_reset": ["The email never arrived", "The link had expired"],
            "technical_error": ["It's still happening", "It works on my phone"],
            "subscription": ["I want a refund instead", "How do I switch plans?"],
        }.get(intent, ["That's sorted it, thanks", "That didn't work"])

    # ── Main entry point ───────────────────────────────────────────────

    def resolve(
        self,
        incident_text: str,
        user_name: str,
        history: list[dict] | None = None,
        conversation_id: str = "",
        preferred_language: str = "auto",
    ) -> dict:
        a = self.assess(incident_text, history, preferred_language)

        if a["is_greeting"]:
            reply = self.response_generator.greet(user_name, a["language"])
            status = "resolved"
            knowledge_title = None
        elif a["escalation_reason"]:
            reply = self.response_generator.generate_escalation(
                incident_text=incident_text,
                confidence=a["confidence"],
                user_name=user_name,
                retrieved_articles=a["articles"],
                reason=a["escalation_reason"],
                mood=a["mood"],
                history=history,
                language=a["language"],
            )
            status = "escalated"
            knowledge_title = None
        else:
            reply = self.response_generator.generate(
                incident_text=incident_text,
                intent=a["intent"],
                retrieved_articles=a["articles"],
                user_name=user_name,
                mood=a["mood"],
                history=history,
                is_follow_up=a["is_follow_up"],
                language=a["language"],
            )
            status = "resolved"
            knowledge_title = a["articles"][0]["title"] if a["articles"] else None

        result = {
            "status": status,
            "incident_text": incident_text,
            "user_name": user_name,
            "predicted_intent": a["intent"],
            "confidence": a["confidence"],
            "knowledge_title": knowledge_title,
            "response": reply,
            "retrieved_articles": self._summarise(a["articles"]),
            "rag_enabled": True,
            "mood": a["mood"],
            "escalation_reason": a["escalation_reason"],
            "follow_up": a["is_follow_up"],
            "suggested_replies": [] if a["is_greeting"] else self._suggestions(status, a["intent"]),
            "language": LANGUAGE_NAMES.get(a["language"], a["language"]),
        }

        store.log_resolution(result, conversation_id)
        return result
