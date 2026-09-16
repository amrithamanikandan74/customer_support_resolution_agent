from app.config import CONFIDENCE_THRESHOLD
from app.services.intent_classifier import IntentClassifier
from app.services.knowledge_retriever import KnowledgeRetriever
from app.services.response_generator import ResponseGenerator


class ResolutionOrchestrator:
    def __init__(self):
        self.intent_classifier = IntentClassifier()
        self.knowledge_retriever = KnowledgeRetriever()
        self.response_generator = ResponseGenerator()

    # ✅ NEW: RCA VALIDATION FUNCTION
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

    # MAIN FUNCTION
    def resolve(self, incident_text: str, user_name: str) -> dict:
        intent_result = self.intent_classifier.predict(incident_text)
        intent = intent_result["intent"]
        confidence = intent_result["confidence"]

        # 🔥 Step 1: Confidence check
        if confidence < CONFIDENCE_THRESHOLD:
            escalation_response = self.response_generator.generate_escalation(
                incident_text=incident_text,
                confidence=confidence,
                user_name=user_name
            )
            return {
                "status": "escalated",
                "incident_text": incident_text,
                "user_name": user_name,
                "predicted_intent": intent,
                "confidence": confidence,
                "knowledge_title": None,
                "response": escalation_response
            }

        #  RCA VALIDATION 
        is_valid = self.validate_intent(intent, incident_text)

        if not is_valid:
            escalation_response = self.response_generator.generate_escalation(
                incident_text=incident_text,
                confidence=confidence,
                user_name=user_name
            )
            return {
                "status": "escalated",
                "incident_text": incident_text,
                "user_name": user_name,
                "predicted_intent": intent,
                "confidence": confidence,
                "knowledge_title": None,
                "response": escalation_response
            }

        
        knowledge = self.knowledge_retriever.retrieve(intent)

        final_response = self.response_generator.generate(
            incident_text=incident_text,
            intent=intent,
            knowledge_title=knowledge["title"],
            knowledge_resolution=knowledge["resolution"],
            user_name=user_name
        )

        return {
            "status": "resolved",
            "incident_text": incident_text,
            "user_name": user_name,
            "predicted_intent": intent,
            "confidence": confidence,
            "knowledge_title": knowledge["title"],
            "response": final_response
        }