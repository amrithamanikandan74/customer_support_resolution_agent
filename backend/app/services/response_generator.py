from google import genai

from app.config import GEMINI_API_KEY, GEMINI_MODEL


class ResponseGenerator:
    """Generates natural-language responses using Google Gemini, grounded in retrieved knowledge articles."""

    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.model = GEMINI_MODEL
        self.client = None

        if self.api_key and self.api_key != "your_api_key_here":
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[!] Warning: Could not initialize Gemini client: {e}")

    def generate(
        self,
        incident_text: str,
        intent: str,
        retrieved_articles: list[dict],
        user_name: str
    ) -> str:
        """Generate a resolution response grounded in retrieved knowledge articles."""

        # Build the knowledge context from retrieved articles
        knowledge_context = ""
        for i, article in enumerate(retrieved_articles, 1):
            knowledge_context += (
                f"\n--- Article {i}: {article['title']} (Relevance: {article['similarity']:.0%}) ---\n"
                f"{article['content']}\n"
            )

        prompt = f"""You are a friendly and professional customer support agent. A customer has reached out with an issue.

CUSTOMER NAME: {user_name}
CUSTOMER ISSUE: {incident_text}
DETECTED INTENT: {intent.replace("_", " ").title()}

RELEVANT KNOWLEDGE ARTICLES:
{knowledge_context}

INSTRUCTIONS:
- Greet the customer by name warmly
- Acknowledge their issue with empathy
- Provide a clear, actionable resolution based on the knowledge articles above
- Use the most relevant article(s) to form your answer — do not make up information
- Keep the tone conversational, professional, and reassuring
- Use short paragraphs for readability
- If the articles suggest multiple steps, present them as a numbered list
- End with an offer to help further

Write the response directly — do not include any metadata, article references, or internal notes."""

        if self.client:
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt
                )
                return response.text.strip()
            except Exception as e:
                print(f"[!] Gemini API call failed: {e}. Falling back to retrieved knowledge.")

        # Fallback response using top retrieved article
        top_art = retrieved_articles[0] if retrieved_articles else None
        if top_art:
            return f"Hello {user_name},\n\nThank you for contacting support regarding: \"{incident_text}\".\n\nBased on our knowledge base article ({top_art['title']}):\n{top_art['content']}\n\nPlease let us know if you need any further assistance!"
        return f"Hello {user_name},\n\nThank you for reaching out. We have received your query and our team is looking into it."

    def generate_escalation(
        self,
        incident_text: str,
        confidence: float,
        user_name: str,
        retrieved_articles: list[dict] = None
    ) -> str:
        """Generate an escalation response when the issue cannot be confidently resolved."""

        # Include any partially relevant articles for context
        article_context = ""
        if retrieved_articles:
            for i, article in enumerate(retrieved_articles, 1):
                article_context += f"\n- {article['title']} (Relevance: {article['similarity']:.0%})"

        prompt = f"""You are a friendly and professional customer support agent. A customer has reached out, but the system could not confidently identify their exact issue.

CUSTOMER NAME: {user_name}
CUSTOMER ISSUE: {incident_text}
SYSTEM CONFIDENCE: {confidence:.0%}
{"PARTIALLY RELATED ARTICLES:" + article_context if article_context else ""}

INSTRUCTIONS:
- Greet the customer by name warmly
- Acknowledge their message and explain that you want to make sure they get the best help possible
- Let them know you are escalating to a specialist who can assist them more thoroughly
- Reassure them that someone will follow up shortly
- Keep it concise (3-4 sentences), warm, and professional

Write the response directly — do not include any metadata or internal notes."""

        if self.client:
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=prompt
                )
                return response.text.strip()
            except Exception as e:
                print(f"[!] Gemini API call failed: {e}. Falling back to default escalation.")

        return f"Hello {user_name},\n\nThank you for contacting us. We have received your issue: \"{incident_text}\".\n\nOur system was unable to automatically resolve your request with high confidence ({confidence:.0%}). Your ticket has been escalated to a human support specialist who will review your case and reply shortly."