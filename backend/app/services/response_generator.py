"""
Turns retrieved knowledge into something a person would actually say.

The original prompt asked for a "friendly and professional customer support
agent", which is exactly the instruction that produces "Dear Valued Customer,
we sincerely apologise for any inconvenience caused." This version gives the
model a name, a voice, and a list of things never to say.
"""

from collections.abc import Iterator

from google import genai

from app.config import AGENT_NAME, AGENT_TEAM, GEMINI_API_KEY, GEMINI_MODEL


VOICE = f"""You are {AGENT_NAME}, a real person working on {AGENT_TEAM}. You are not a bot
and you never describe yourself as one.

How you write:
- Like a competent colleague typing a message, not like a form letter.
- Use contractions. Short sentences. Plain words.
- Lead with the answer. The customer wants to know if they've lost money or
  lost their account — tell them that in the first line, then explain.
- Say "I" and "you". Never "we regret to inform", "valued customer",
  "kindly", "please be advised", "at your earliest convenience",
  "we apologise for the inconvenience", or "rest assured".
- One apology at most, and only if something actually went wrong on our side.
  Don't apologise for the customer's own typo or for a normal bank delay.
- Numbered steps only when there is genuinely more than one thing to do.
  A one-step answer is one sentence, not a list of one.
- No sign-off block, no "Best regards", no ticket numbers unless given one.
- End with one specific question or offer, not "let us know if you need
  anything else".
- Reply in the same language the customer wrote in. If they wrote in
  Malayalam, Hindi or Hinglish, answer in that, naturally, not translated.

Hard rule: every factual claim must come from the help articles provided.
If the articles don't cover something the customer asked, say plainly that
you don't have that detail and that you'll get it checked — never invent
policy, timeframes, amounts, or account state."""


MOOD_NOTE = {
    "calm": "The customer is matter-of-fact. Match that — friendly, efficient, no gushing.",
    "frustrated": (
        "The customer is fed up. Acknowledge that in one short line, without grovelling, "
        "then get straight to what fixes it. Do not use exclamation marks. Do not be chirpy."
    ),
    "urgent": (
        "The customer is under time pressure or money is at stake. Front-load the single "
        "most useful fact, keep it tight, and be explicit about timing."
    ),
}


class ResponseGenerator:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.model = GEMINI_MODEL
        self.client = None

        if self.api_key and self.api_key != "your_api_key_here":
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[!] Could not start Gemini client: {e}")

    @property
    def connected(self) -> bool:
        return self.client is not None

    # ── Prompt assembly ────────────────────────────────────────────────

    @staticmethod
    def _articles_block(articles: list[dict]) -> str:
        if not articles:
            return "(none found)"
        return "\n".join(
            f"\n[Article {i}] {a['title']} — {a['similarity']:.0%} match\n{a['content']}"
            for i, a in enumerate(articles, 1)
        )

    @staticmethod
    def _history_block(history: list[dict]) -> str:
        if not history:
            return ""
        lines = "\n".join(
            f"{'Customer' if h['role'] == 'customer' else AGENT_NAME}: {h['text']}"
            for h in history[-6:]
        )
        return f"\nEARLIER IN THIS CONVERSATION:\n{lines}\n"

    def _build(self, incident_text, intent, articles, user_name, mood, history, is_follow_up, language="English"):
        lang_note = f"\nTARGET LANGUAGE: Write your response entirely in {language}." if language and language != "English" else ""
        return f"""{VOICE}

{MOOD_NOTE.get(mood, MOOD_NOTE["calm"])}{lang_note}

CUSTOMER: {user_name}
WHAT THEY JUST SAID: {incident_text}
WHAT THIS LOOKS LIKE: {intent.replace('_', ' ')}
{self._history_block(history)}
HELP ARTICLES YOU MAY USE:
{self._articles_block(articles)}

{"This is a follow-up. Don't greet them again and don't repeat what you already told them — answer the new question only." if is_follow_up else f"Open by using their name once, naturally, the way you would in a message to a colleague."}

Write only the message. No subject line, no notes, no mention of articles or confidence scores."""

    # ── Public API ─────────────────────────────────────────────────────

    def generate(
        self,
        incident_text: str,
        intent: str,
        retrieved_articles: list[dict],
        user_name: str,
        mood: str = "calm",
        history: list[dict] | None = None,
        is_follow_up: bool = False,
        language: str = "English",
    ) -> str:
        prompt = self._build(incident_text, intent, retrieved_articles,
                             user_name, mood, history or [], is_follow_up, language)
        if self.client:
            try:
                r = self.client.models.generate_content(model=self.model, contents=prompt)
                return r.text.strip()
            except Exception as e:
                print(f"[!] Gemini call failed: {e}. Using the local fallback.")
        return self._fallback(incident_text, retrieved_articles, user_name, is_follow_up, language)

    def stream(
        self,
        incident_text: str,
        intent: str,
        retrieved_articles: list[dict],
        user_name: str,
        mood: str = "calm",
        history: list[dict] | None = None,
        is_follow_up: bool = False,
        language: str = "English",
    ) -> Iterator[str]:
        """Yield the reply in chunks so the customer isn't watching a blank screen."""
        prompt = self._build(incident_text, intent, retrieved_articles,
                             user_name, mood, history or [], is_follow_up, language)
        if self.client:
            try:
                for chunk in self.client.models.generate_content_stream(
                    model=self.model, contents=prompt
                ):
                    if getattr(chunk, "text", None):
                        yield chunk.text
                return
            except Exception as e:
                print(f"[!] Gemini stream failed: {e}. Using the local fallback.")
        yield self._fallback(incident_text, retrieved_articles, user_name, is_follow_up, language)

    def generate_escalation(
        self,
        incident_text: str,
        confidence: float,
        user_name: str,
        retrieved_articles: list[dict] | None = None,
        reason: str = "low_confidence",
        mood: str = "calm",
        history: list[dict] | None = None,
        language: str = "English",
    ) -> str:
        nearby = ""
        if retrieved_articles:
            nearby = "\n".join(f"- {a['title']} ({a['similarity']:.0%})" for a in retrieved_articles)

        why = {
            "low_confidence": "you can't tell for certain what they're asking about",
            "no_matching_article": "the help articles genuinely don't cover this",
            "wording_mismatch": "the wording doesn't line up with what you'd expect for this kind of issue",
        }.get(reason, "you can't answer this one safely")

        lang_note = f"\nTARGET LANGUAGE: Write your response entirely in {language}." if language and language != "English" else ""

        prompt = f"""{VOICE}

{MOOD_NOTE.get(mood, MOOD_NOTE["calm"])}{lang_note}

CUSTOMER: {user_name}
WHAT THEY SAID: {incident_text}
{self._history_block(history or [])}
SITUATION: {why}, so this needs a human colleague.
CLOSEST ARTICLES (may not be relevant):
{nearby or "(nothing close)"}

Write a short message (three or four sentences) that:
- says honestly that you don't want to guess at this one
- does NOT pretend to solve it, and does not repeat generic troubleshooting
- tells them a colleague is picking it up
- asks for the one piece of information that would help the colleague most,
  based on what they described

Write only the message."""

        if self.client:
            try:
                r = self.client.models.generate_content(model=self.model, contents=prompt)
                return r.text.strip()
            except Exception as e:
                print(f"[!] Gemini call failed: {e}. Using the local fallback.")

        if language == "Spanish":
            return (
                f"{user_name}, prefiero no adivinar en este caso: no estoy lo suficientemente seguro de haberlo entendido correctamente. "
                f"Lo estoy pasando a un colega que lo solucionará. Si puedes añadir más detalles, les ahorrará tiempo."
            )
        elif language == "French":
            return (
                f"{user_name}, je préfère ne pas deviner — je ne suis pas assez sûr de l'avoir compris correctement. "
                f"Je le transmets à un collègue. Si vous pouvez ajouter des détails, cela leur fera gagner du temps."
            )
        elif language == "German":
            return (
                f"{user_name}, ich möchte hier lieber nicht raten — ich bin mir nicht sicher genug, ob ich es richtig verstanden habe. "
                f"Ich leite es an einen Kollegen weiter. Wenn Sie weitere Details hinzufügen können, spart das Zeit."
            )
        elif language == "Hindi":
            return (
                f"{user_name}, मैं इस पर अनुमान नहीं लगाना चाहता — मुझे पूरा यकीन नहीं है। "
                f"मैं इसे अपने सहयोगी को सौंप रहा हूँ। यदि आप कुछ और विवरण दे सकें, तो इससे उनका समय बचेगा।"
            )

        return (
            f"{user_name}, I'd rather not guess at this one — I'm not confident enough that "
            f"I've understood it correctly, and a wrong answer here would waste your time.\n\n"
            f"I'm passing it to a colleague who handles these directly. If you can add any "
            f"detail — when it started, and anything you've already tried — it'll save them "
            f"a round trip."
        )

    # ── Offline fallback ───────────────────────────────────────────────

    @staticmethod
    def _fallback(incident_text, articles, user_name, is_follow_up=False, language="English") -> str:
        top = articles[0] if articles else None
        if not top:
            if language == "Spanish":
                return f"{user_name}, recibí tu mensaje pero ningún artículo lo cubre. Le pediré a un colega que lo revise."
            elif language == "French":
                return f"{user_name}, j'ai bien reçu votre message mais aucun article ne le couvre. Je demande à un collègue de regarder."
            elif language == "German":
                return f"{user_name}, ich habe deine Nachricht erhalten, aber kein Artikel deckt das ab. Ein Kollege wird sich das ansehen."
            elif language == "Hindi":
                return f"{user_name}, मुझे आपका संदेश मिल गया है लेकिन हमारे लेखों में यह नहीं है। मैं एक सहयोगी को देखने के लिए कहूँगा।"
            return (
                f"{user_name}, I've got your message but nothing in our help articles covers "
                f"it, so I don't want to guess. Let me get a colleague to look."
            )

        if language == "Spanish":
            opener = "" if is_follow_up else f"Hola {user_name} — aquí está la información sobre tu caso.\n\n"
            return f"{opener}{top['content']}\n\n¿Esto resuelve tu consulta?"
        elif language == "French":
            opener = "" if is_follow_up else f"Bonjour {user_name} — voici où en est votre demande.\n\n"
            return f"{opener}{top['content']}\n\nEst-ce que cela correspond à votre situation ?"
        elif language == "German":
            opener = "" if is_follow_up else f"Hallo {user_name} — hier ist der aktuelle Stand.\n\n"
            return f"{opener}{top['content']}\n\nPasst das zu Ihrer Situation?"
        elif language == "Hindi":
            opener = "" if is_follow_up else f"नमस्ते {user_name} — आपके अनुरोध की स्थिति यहाँ है।\n\n"
            return f"{opener}{top['content']}\n\nक्या यह आपकी समस्या का समाधान करता है?"

        opener = "" if is_follow_up else f"{user_name} — here's where that stands.\n\n"
        return f"{opener}{top['content']}\n\nDoes that match what you're seeing?"