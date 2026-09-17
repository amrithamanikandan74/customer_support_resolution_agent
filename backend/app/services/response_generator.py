"""
Turns retrieved knowledge into something a person would actually say.

The original prompt asked for a "friendly and professional customer support
agent", which is exactly the instruction that produces "Dear Valued Customer,
we sincerely apologise for any inconvenience caused." This version gives the
model a name, a voice, and a list of things never to say.
"""

from collections.abc import Iterator

from google import genai

from app.config import AGENT_NAME, AGENT_TEAM, GEMINI_API_KEY, GEMINI_MODEL, LANGUAGE_NAMES


VOICE = f"""You are {AGENT_NAME}, a real person working on {AGENT_TEAM}. You are not a bot
and you never describe yourself as one.

How you write:
- Like a quick chat message, not a written statement or an email. Short.
  Casual. The kind of thing you'd actually type into a chat window.
- Use contractions. Short sentences — most replies are 2-4 sentences total,
  not a formal breakdown of the situation.
- Lead with the answer. The customer wants to know if they've lost money or
  lost their account — tell them that in the first line, then explain.
- Say "I" and "you". Never "we regret to inform", "valued customer",
  "kindly", "please be advised", "at your earliest convenience",
  "we apologise for the inconvenience", "rest assured", "I understand your
  concern", or any other line that sounds read off a script.
- One apology at most, and only if something actually went wrong on our side.
  Don't apologise for the customer's own typo or for a normal bank delay.
- Numbered steps only when there is genuinely more than one thing to do.
  A one-step answer is one sentence, not a list of one.
- No sign-off block, no "Best regards", no ticket numbers unless given one.
- End with one specific question or offer, not "let us know if you need
  anything else".
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


# Canned replies used when Gemini isn't reachable. Only languages listed here
# actually get translated fallback text — any other language silently drops
# to English, so callers must check the *returned* language, not just the
# one they asked for. See generate()/stream()/generate_escalation()/greet(),
# all of which now report what language they actually delivered.
FALLBACK_GREETING = {
    "en": "Hey {name} — what's going on?",
    "hi": "Hi {name} — bataiye, kya dikkat aa rahi hai?",
    "ml": "Hai {name} — എന്താണ് പ്രശ്നം?",
    "es": "Hola {name} — ¿qué ha pasado?",
    "fr": "Bonjour {name} — que se passe-t-il ?",
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
    def _language_line(language: str) -> str:
        name = LANGUAGE_NAMES.get(language, language)
        if language == "en":
            return "Write the reply in English."
        return (
            f"Write the entire reply in {name}, naturally, the way a native speaker "
            f"would type a quick message — not a stiff or literal translation."
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

    def _build(self, incident_text, intent, articles, user_name, mood, history, is_follow_up, language="en"):
        return f"""{VOICE}

{MOOD_NOTE.get(mood, MOOD_NOTE["calm"])}

{self._language_line(language)}

CUSTOMER: {user_name}
WHAT THEY JUST SAID: {incident_text}
WHAT THIS LOOKS LIKE: {intent.replace('_', ' ')}
{self._history_block(history)}
HELP ARTICLES YOU MAY USE:
{self._articles_block(articles)}

{"This is a follow-up. Don't greet them again and don't repeat what you already told them — answer the new question only." if is_follow_up else "Open by using their name once, naturally, the way you would in a message to a colleague."}

Write only the message. No subject line, no notes, no mention of articles or confidence scores."""

    # ── Public API ─────────────────────────────────────────────────────
    # Every method below returns (text, actual_language) — the language
    # actually delivered, which is only ever a translated language when
    # Gemini wrote the reply. The offline fallback is English-only except
    # for greet(), which has a handful of canned translations; anything
    # else that falls back reports "en" honestly rather than echoing back
    # whatever the customer asked for.

    def generate(
        self,
        incident_text: str,
        intent: str,
        retrieved_articles: list[dict],
        user_name: str,
        mood: str = "calm",
        history: list[dict] | None = None,
        is_follow_up: bool = False,
        language: str = "en",
    ) -> tuple[str, str]:
        prompt = self._build(incident_text, intent, retrieved_articles,
                             user_name, mood, history or [], is_follow_up, language)
        if self.client:
            try:
                r = self.client.models.generate_content(model=self.model, contents=prompt)
                return r.text.strip(), language
            except Exception as e:
                print(f"[!] Gemini call failed: {e}. Using the local fallback.")
        return self._fallback(incident_text, retrieved_articles, user_name, is_follow_up), "en"

    def stream(
        self,
        incident_text: str,
        intent: str,
        retrieved_articles: list[dict],
        user_name: str,
        mood: str = "calm",
        history: list[dict] | None = None,
        is_follow_up: bool = False,
        language: str = "en",
        report: dict | None = None,
    ) -> Iterator[str]:
        """
        Yield the reply in chunks so the customer isn't watching a blank screen.

        `report`, if given, is filled in with {"language": <actual code>} once
        the generator finishes — the caller can't get a return value out of a
        generator any other way, and it needs to know whether the stream
        actually landed in the requested language or fell back to English.
        """
        if report is None:
            report = {}
        prompt = self._build(incident_text, intent, retrieved_articles,
                             user_name, mood, history or [], is_follow_up, language)
        if self.client:
            sent_any = False
            try:
                for chunk in self.client.models.generate_content_stream(
                    model=self.model, contents=prompt
                ):
                    if getattr(chunk, "text", None):
                        sent_any = True
                        yield chunk.text
                report["language"] = language
                return
            except Exception as e:
                print(f"[!] Gemini stream failed: {e}. Using the local fallback.")
                if sent_any:
                    # We already streamed part of a real (Gemini) reply to the
                    # customer. Appending the canned English fallback here
                    # would glue mismatched text onto the end of it — stop
                    # instead of making it worse.
                    report["language"] = language
                    return
        report["language"] = "en"
        yield self._fallback(incident_text, retrieved_articles, user_name, is_follow_up)

    def generate_escalation(
        self,
        incident_text: str,
        confidence: float,
        user_name: str,
        retrieved_articles: list[dict] | None = None,
        reason: str = "low_confidence",
        mood: str = "calm",
        history: list[dict] | None = None,
        language: str = "en",
    ) -> tuple[str, str]:
        nearby = ""
        if retrieved_articles:
            nearby = "\n".join(f"- {a['title']} ({a['similarity']:.0%})" for a in retrieved_articles)

        why = {
            "low_confidence": "you can't tell for certain what they're asking about",
            "no_matching_article": "the help articles genuinely don't cover this",
            "wording_mismatch": "the wording doesn't line up with what you'd expect for this kind of issue",
        }.get(reason, "you can't answer this one safely")

        prompt = f"""{VOICE}

{MOOD_NOTE.get(mood, MOOD_NOTE["calm"])}

{self._language_line(language)}

CUSTOMER: {user_name}
WHAT THEY SAID: {incident_text}
{self._history_block(history or [])}
SITUATION: {why}, so this needs a human colleague.
CLOSEST ARTICLES (may not be relevant):
{nearby or "(nothing close)"}

Write a short message (two or three sentences, like a quick chat reply, not
a formal explanation) that:
- says plainly you don't want to guess at this one
- does NOT pretend to solve it, and does not repeat generic troubleshooting
- tells them a colleague is picking it up
- asks for the one piece of information that would help the colleague most,
  based on what they described

Write only the message."""

        if self.client:
            try:
                r = self.client.models.generate_content(model=self.model, contents=prompt)
                return r.text.strip(), language
            except Exception as e:
                print(f"[!] Gemini call failed: {e}. Using the local fallback.")

        return (
            f"Hmm, I'm not sure enough about this one to risk a wrong answer, {user_name}. "
            f"I'll get a colleague on it — if you can say when it started and what "
            f"you've already tried, that'll help them jump straight in."
        ), "en"

    def greet(self, user_name: str, language: str = "en") -> tuple[str, str]:
        """A bare 'hi' isn't an issue — answer it like a person would."""
        prompt = f"""{VOICE}

{self._language_line(language)}

CUSTOMER: {user_name}
They've just said hello — nothing else yet.

Write one short, warm sentence that greets them back by name and asks what's
going on. No corporate phrasing, no "How can I assist you today". Write only
the message."""

        if self.client:
            try:
                r = self.client.models.generate_content(model=self.model, contents=prompt)
                return r.text.strip(), language
            except Exception as e:
                print(f"[!] Gemini call failed: {e}. Using the local fallback.")

        if language in FALLBACK_GREETING:
            return FALLBACK_GREETING[language].format(name=user_name), language
        return FALLBACK_GREETING["en"].format(name=user_name), "en"

    # ── Offline fallback ───────────────────────────────────────────────

    @staticmethod
    def _fallback(incident_text, articles, user_name, is_follow_up=False) -> str:
        top = articles[0] if articles else None
        if not top:
            return (
                f"Hmm, I don't have anything on that in our help docs, {user_name} — "
                f"don't want to guess wrong, so let me get someone to take a look."
            )
        opener = "" if is_follow_up else f"Hey {user_name}, here's what I've got:\n\n"
        return f"{opener}{top['content']}\n\nDoes that sound like what's happening?"