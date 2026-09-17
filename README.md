# Customer Support Resolution Agent

An AI support agent that tries to answer customer questions itself, but only
when it's actually sure — otherwise it hands the conversation to a human.

The problem I wanted to solve: an LLM that always sounds confident is
dangerous in a support context, because it'll happily make up an answer that
sounds right but isn't. So instead of just calling Gemini and hoping for the
best, every message first goes through an intent classifier and a search
over the knowledge base. The model only gets to write a reply if the
confidence score, the article match, and a keyword sanity-check all agree —
and even then, it's only allowed to use what it actually retrieved. If
anything looks shaky, the customer gets escalated with a real ticket number
instead of a canned "please contact support."

## What it does

- **Answers come from the knowledge base, not the model's memory.** Replies
  are grounded in articles found through semantic search (ChromaDB +
  sentence-transformers) — 28 articles across 9 categories, covering
  logins, payments, refunds, orders, subscriptions, and more.
- **It's willing to say "I don't know."** Confidence, similarity, and a
  keyword check all have to pass before it answers. If one fails, it
  escalates instead of guessing.
- **It talks like a person.** The agent has a name (Maya) and steers clear
  of stock phrases like "kindly" or "rest assured." It also picks up on
  whether the customer sounds calm, frustrated, or in a rush, and adjusts
  its tone accordingly.
- **It replies in the customer's language,** either detected automatically
  or picked from the UI — English, ten Indian languages, and a few others.
- **Small talk doesn't trip the pipeline.** A message like "hi" gets a warm
  reply instead of getting escalated for having no real content to work
  with.
- **Replies stream in** so the answer appears as it's written, with the
  reasoning (intent, confidence, matched articles) showing up first.
- **Escalation is a real handoff**, not a dead end — the customer gets a
  ticket number and an expected reply time.
- **It shows where the knowledge base is weak.** Every resolution, feedback
  vote, and ticket gets logged, and an ops dashboard turns that into a
  resolution rate, a breakdown by intent, and a list of the questions it
  was least confident about — a decent hint for what article to write next.

## How a request flows

```
Customer message
       │
       ▼
Small talk?  ──yes──▶  Warm reply, skip the pipeline
       │no
       ▼
Detect language ──▶ Classify intent (TF-IDF + Logistic Regression)
       │
       ▼
Retrieve top-K articles (semantic search, ChromaDB)
       │
       ▼
Guardrail check:
  • confidence ≥ threshold?
  • best article similarity ≥ minimum?
  • does the wording back up the predicted intent?
       │
   ┌───┴───┐
  pass    fail
   │        │
   ▼        ▼
Generate    Escalate — offer a
grounded    human handoff with
reply       a ticket reference
   │        │
   └───┬────┘
       ▼
Log the outcome → feeds the ops dashboard
```

## Stack

**Backend** — FastAPI, Google Gemini (`google-genai`) for writing replies,
with an offline fallback for when there's no API key. ChromaDB +
sentence-transformers (`all-MiniLM-L6-v2`) handle retrieval, scikit-learn
(TF-IDF + Logistic Regression) handles intent classification, `langdetect`
handles language detection, and logging is just CSV — no database to stand
up.

**Frontend** — React 19 + Vite, no UI framework. Hand-built components with
a custom design system (Bricolage Grotesque + Newsreader, aubergine and
porcelain palette). Responses stream over SSE, and chats are saved to
`localStorage`.

## Project structure

```
backend/
├── app/
│   ├── main.py                        FastAPI routes
│   ├── config.py                      thresholds, agent identity, languages
│   ├── schemas.py                     Pydantic request/response models
│   └── services/
│       ├── intent_classifier.py       TF-IDF + Logistic Regression
│       ├── rag_retriever.py           ChromaDB semantic search
│       ├── resolution_orchestrator.py guardrails, mood/language detection
│       ├── response_generator.py      Gemini prompt + offline fallback
│       └── store.py                   CSV logging + ops aggregation
├── data/
│   ├── knowledge_base.json            28 articles across 9 categories
│   ├── incidents.csv                  135 labelled training examples
│   └── build_vector_store.py          standalone index builder
├── tests/                             pytest suite (API, orchestrator, classifier, retriever)
├── train_model.py                     regenerate the intent classifier
└── run.py                             dev server entry point

frontend/
└── src/
    ├── App.jsx                        chat, inspector, ops dashboard, escalation form
    ├── App.css / index.css            design tokens and layout
    └── main.jsx                       Vite entry point
```

## Getting started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A [Gemini API key](https://aistudio.google.com/apikey) (optional — without
  one, the agent falls back to a template reply and the guardrail logic
  still works, just without generated prose)

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env                                  # add your GEMINI_API_KEY
python run.py
```

The server runs at `http://127.0.0.1:8000`. On first run, `sentence-transformers`
downloads its embedding model (~80MB) from Hugging Face, which needs an
internet connection once and is then cached locally. The vector index and
the intent model are both built automatically on first startup if they
don't already exist. Run `train_model.py` or `data/build_vector_store.py`
by hand to rebuild either one.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # point VITE_API_URL elsewhere if the backend isn't local
npm run dev
```

Opens at `http://localhost:5173`.

### Tests

```bash
cd backend
pytest
```

## API

| Endpoint | What it does |
|---|---|
| `POST /resolve` | Full pipeline, single JSON response |
| `POST /resolve/stream` | Same pipeline as server-sent events (`meta` → `token`... → `done`) |
| `GET /knowledge` | List all knowledge base articles |
| `GET /languages` | Supported reply languages |
| `POST /feedback` | Log a thumbs up/down on a reply |
| `POST /escalate` | Hand a case to a human, returns a ticket reference |
| `GET /stats` | Resolution rate, per-intent breakdown, and knowledge gaps |
