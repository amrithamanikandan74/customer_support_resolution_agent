# Customer Support Resolution Agent

A support agent that answers Tier-1 customer questions itself when it's actually
confident, and hands off to a human the moment it isn't — instead of guessing.

It's built around one idea: an LLM that always sounds confident is a liability
in customer support. So the pipeline runs every incoming message through an
intent classifier and a semantic search over a knowledge base, checks the
result against a confidence threshold **and** a keyword guardrail, and only
then lets the model write a reply — grounded strictly in the articles it
retrieved. Anything that doesn't clear the bar gets escalated with a real
ticket reference, not a canned "please contact support."

## What it does

- **Answers from a knowledge base, not from memory.** Every reply is grounded
  in articles retrieved by semantic search (ChromaDB + sentence-transformers)
  over 25 support articles across 8 categories — logins, payments, refunds,
  orders, subscriptions, and more.
- **Knows when to say "I don't know."** A confidence threshold, a minimum
  retrieval-similarity check, and a keyword-based guardrail all have to pass
  before the agent auto-resolves. Fail any of them and it escalates instead of
  answering with something that sounds right but isn't grounded.
- **Talks like a person, not a template.** The agent has a name (Maya) and a
  written voice with a list of banned corporate phrases ("kindly", "please be
  advised", "rest assured"). It reads the customer's tone — calm, frustrated,
  or under time pressure — and adjusts accordingly.
- **Replies in the customer's language.** Auto-detects the language of the
  incoming message, or the customer can pin a specific one from a picker in
  the UI, covering English plus ten Indian languages and a few others.
- **Handles small talk without escalating it.** A bare "hi" gets a warm reply,
  not a trip through the full confidence pipeline (a "hlo" used to get
  escalated to a human queue for having no content — that's fixed).
- **Streams the reply** over server-sent events so the answer appears as it's
  written, with the reasoning (intent, confidence, matched articles) arriving
  first so the UI can show its work while the text is still typing out.
- **Escalates with a real handoff.** When a case needs a person, the customer
  leaves an email and gets back a ticket reference (`CS-4031`) and an expected
  reply window, not a dead end.
- **Learns where the knowledge base is thin.** Every resolution, feedback vote,
  and ticket is logged to CSV. An ops dashboard in the UI turns that into a
  resolution rate, per-intent breakdown, and — most usefully — a list of the
  lowest-confidence questions that came in, which is exactly where a new
  article should be written.

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

**Backend** — FastAPI, Google Gemini (`google-genai`) for generation with an
offline template fallback when no API key is set, ChromaDB + sentence-transformers
(`all-MiniLM-L6-v2`) for retrieval, scikit-learn (TF-IDF + Logistic Regression)
for intent classification, `langdetect` for language detection, CSV-backed
logging (no database to stand up).

**Frontend** — React 19 + Vite, no UI framework — hand-built components and a
custom design system (Bricolage Grotesque + Newsreader, aubergine-and-porcelain
palette). Streams responses over SSE, persists chats to `localStorage`.

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
│   ├── knowledge_base.json            25 articles across 8 categories
│   ├── incidents.csv                  120 labelled training examples
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
- A [Gemini API key](https://aistudio.google.com/apikey) (optional — the agent
  falls back to a template response without one, so the guardrail logic still
  works, just without generated prose)

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env                                  # add your GEMINI_API_KEY
python run.py
```

The server runs at `http://127.0.0.1:8000`. On first run, `sentence-transformers`
downloads its embedding model (~80MB) from Hugging Face — that needs an
internet connection once, after which it's cached locally. The vector index
and the intent model are both built automatically on first startup if they
don't already exist; `train_model.py` and `data/build_vector_store.py` let you
regenerate either by hand.

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

## Known limitations

- The intent classifier is trained on 120 examples across 8 categories — solid
  for a portfolio-scale knowledge base, but it won't generalize to intents
  outside that set. Add rows to `data/incidents.csv` and re-run `train_model.py`
  to extend it.
- CSV logging is intentionally simple (no database to run), which means
  concurrent writes aren't safely serialized beyond a basic lock — fine for a
  single-instance deployment, not for scaling out.
- Language detection on very short messages (a few words) is unreliable by
  nature; the language picker in the UI exists specifically so a customer
  isn't stuck with a bad guess.


