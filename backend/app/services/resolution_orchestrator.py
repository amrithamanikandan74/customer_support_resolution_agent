from app.config import CONFIDENCE_THRESHOLD
from app.services.intent_classifier import IntentClassifier
from app.services.rag_retriever import RAGRetriever
from app.services.response_generator import ResponseGenerator


class ResolutionOrchestrator:
    def __init__(self):
        self.intent_classifier = IntentClassifier()
        self.rag_retriever = RAGRetriever()
        self.response_generator = ResponseGenerator()

    # ✅ RCA VALIDATION FUNCTION (unchanged)
    def validate_intent(self, intent: str, text: str) -> bool:
        text = text.lower()

        rules = {
            "login_issue": ["login", "sign in", "log in"],
            "password_reset": ["password", "reset"],
            "payment_failed": ["payment", "deducted", "transaction"],
            "refund_request": ["refund", "money back"],
            "order_delay": ["order", "delivery", "late"],
            "account_locked": ["lock", "locked", "blocked"],
            "technical_error": ["error", "crash", "server"]
        }

        keywords = rules.get(intent, [])

        # check if any keyword exists
        return any(keyword in text for keyword in keywords)

    # MAIN FUNCTION — now with RAG
    def resolve(self, incident_text: str, user_name: str) -> dict:
        # Step 1: Classify intent (unchanged)
        intent_result = self.intent_classifier.predict(incident_text)
        intent = intent_result["intent"]
        confidence = intent_result["confidence"]

        # Step 2: RAG retrieval (always runs — semantic search)
        retrieved_articles = self.rag_retriever.retrieve(incident_text)

        # Format articles for the API response
        articles_summary = [
            {
                "title": a["title"],
                "category": a["category"],
                "similarity": round(a["similarity"], 2)
            }
            for a in retrieved_articles
        ]

        # Step 3: Confidence check
        if confidence < CONFIDENCE_THRESHOLD:
            escalation_response = self.response_generator.generate_escalation(
                incident_text=incident_text,
                confidence=confidence,
                user_name=user_name,
                retrieved_articles=retrieved_articles
            )
            return {
                "status": "escalated",
                "incident_text": incident_text,
                "user_name": user_name,
                "predicted_intent": intent,
                "confidence": confidence,
                "knowledge_title": None,
                "response": escalation_response,
                "retrieved_articles": articles_summary,
                "rag_enabled": True
            }

        # Step 4: RCA VALIDATION
        is_valid = self.validate_intent(intent, incident_text)

        if not is_valid:
            escalation_response = self.response_generator.generate_escalation(
                incident_text=incident_text,
                confidence=confidence,
                user_name=user_name,
                retrieved_articles=retrieved_articles
            )
            return {
                "status": "escalated",
                "incident_text": incident_text,
                "user_name": user_name,
                "predicted_intent": intent,
                "confidence": confidence,
                "knowledge_title": None,
                "response": escalation_response,
                "retrieved_articles": articles_summary,
                "rag_enabled": True
            }

        # Step 5: Generate response using RAG
        top_article = retrieved_articles[0] if retrieved_articles else None

        final_response = self.response_generator.generate(
            incident_text=incident_text,
            intent=intent,
            retrieved_articles=retrieved_articles,
            user_name=user_name
        )

        return {
            "status": "resolved",
            "incident_text": incident_text,
            "user_name": user_name,
            "predicted_intent": intent,
            "confidence": confidence,
            "knowledge_title": top_article["title"] if top_article else None,
            "response": final_response,
            "retrieved_articles": articles_summary,
            "rag_enabled": True
        }