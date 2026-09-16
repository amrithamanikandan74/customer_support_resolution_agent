import json

from app.config import KNOWLEDGE_BASE_FILE


class KnowledgeRetriever:
    def __init__(self):
        with open(KNOWLEDGE_BASE_FILE, "r", encoding="utf-8") as f:
            self.knowledge_base = json.load(f)

    def retrieve(self, intent: str) -> dict:
        result = self.knowledge_base.get(intent)

        if not result:
            return {
                "title": "No Matching Knowledge Found",
                "resolution": "No matching resolution was found in the knowledge base. Please escalate this incident to a human support agent."
            }

        return result