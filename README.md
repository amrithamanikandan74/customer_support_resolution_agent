# Customer Support AI Resolution Agent

An **enterprise-grade, autonomous customer support agent** powered by **Retrieval-Augmented Generation (RAG)**, **Google Gemini 2.0 Flash**, **ChromaDB**, and **FastAPI**.

Designed to automatically diagnose, retrieve knowledge, and resolve Tier-1 customer support incidents with high accuracy, zero hallucinations, and built-in Root Cause Analysis (RCA) guardrails.

---

## Key Features

* **Semantic Vector Search (RAG)**: Uses `sentence-transformers` (`all-MiniLM-L6-v2`) and **ChromaDB** to index and retrieve the top-matching knowledge base articles out of 25+ detailed scenarios.
* **Grounded LLM Generation**: Integrates **Google Gemini 2.0 Flash** to produce empathetic, natural-language resolutions strictly grounded in verified knowledge articles.
* **RCA & Confidence Guardrails**: Validates intent confidence thresholds and enforces Root Cause Analysis (RCA) keyword rules before auto-resolving — automatically escalating low-confidence issues to human specialists.
* **Executive Dashboard & UI**: Responsive, non-gradient dark slate interface featuring real-time system metrics, category incident cards, dynamic resolution metadata, and conversation history.
* **Offline Resilient Fallback**: Includes local template fallback generators when an external LLM API key is not configured or network calls fail.

---

## System Architecture

```text
               ┌────────────────────────┐
               │    Customer Incident   │
               └───────────┬────────────┘
                           │
                           ▼
             ┌───────────────────────────┐
             │ TF-IDF Intent Classifier  │
             └─────────────┬─────────────┘
                           │
       ┌───────────────────┴───────────────────┐
       │                                       │
       ▼                                       ▼
┌───────────────┐                  ┌──────────────────────┐
│  RCA Rule &   │                  │  ChromaDB Vector     │
│  Confidence   │                  │  Search (Top K)      │
└──────┬────────┘                  └──────────┬───────────┘
       │                                      │
       └───────────────────┬──────────────────┘
                           │
                           ▼
             ┌───────────────────────────┐
             │   Google Gemini 2.0 LLM   │
             │   Grounded Response Gen   │
             └─────────────┬─────────────┘
                           │
                           ▼
             ┌───────────────────────────┐
             │  Structured Resolution    │
             │  (Resolved or Escalated)  │
             └─────────────┬─────────────┘
```

---

## Technology Stack

### Backend
* **Framework**: FastAPI, Uvicorn
* **Generative AI**: Google Gemini API (`google-genai` SDK)
* **Vector Database**: ChromaDB
* **Embeddings**: `sentence-transformers` (`all-MiniLM-L6-v2`)
* **Machine Learning**: Scikit-Learn (TF-IDF Intent Classifier), Joblib
* **Data Processing**: Pandas, Pydantic v2

### Frontend
* **Core**: React 18, Vite 8
* **Styling**: Modern Vanilla CSS Design Tokens (Obsidian & Slate Theme)
* **State Management**: React Hooks (Local & Session State)

---

## Project Structure

```text
customer_support_resolution_agent/
├── backend/
│   ├── app/
│   │   ├── services/
│   │   │   ├── rag_retriever.py         # ChromaDB semantic vector search
│   │   │   ├── response_generator.py    # Gemini 2.0 Flash integration
│   │   │   ├── intent_classifier.py     # TF-IDF intent prediction
│   │   │   └── resolution_orchestrator.py # Core RAG & guardrail pipeline
│   │   ├── config.py                    # Environment & system parameters
│   │   ├── main.py                      # FastAPI application endpoints
│   │   └── schemas.py                   # Pydantic request & response models
│   ├── data/
│   │   ├── knowledge_base.json          # 25 detailed knowledge articles
│   │   ├── incidents.csv                # Training datasets
│   │   └── build_vector_store.py        # Vector embedding build script
│   ├── models/
│   │   └── intent_model.pkl             # Trained classifier artifact
│   ├── .env.example                     # Environment template
│   ├── requirements.txt                 # Python dependencies
│   └── run.py                           # Server runner script
└── frontend/
    ├── src/
    │   ├── App.jsx                      # Main app & dashboard components
    │   ├── App.css                      # Resolution Hub styles & tokens
    │   ├── index.css                    # Slate design system
    │   └── main.jsx                     # Vite React entry point
    ├── index.html                       # HTML template
    └── package.json                     # Frontend dependencies
```

---

## Getting Started

### Prerequisites
* **Python 3.10+**
* **Node.js 18+**

---

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create & activate virtual environment**:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```
   > Note: Free API keys are available at [Google AI Studio](https://aistudio.google.com/apikey). If left unconfigured, the system automatically uses the local RAG template fallback.

5. **Build the ChromaDB Vector Store**:
   ```bash
   python data/build_vector_store.py
   ```

6. **Start the FastAPI Backend**:
   ```bash
   python run.py
   ```
   *The server runs on **`http://127.0.0.1:8000`***

---

### Frontend Setup

1. Open a new terminal and **navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Vite Development Server**:
   ```bash
   npm run dev
   ```
   *The application will open on **`http://localhost:5173/`***

---

## API Reference

### `POST /resolve`

Submits a customer incident text for AI diagnosis and resolution.

#### Request Body
```json
{
  "incident_text": "I was charged twice on my credit card for order #49201",
  "user_name": "Alice"
}
```

#### Response Body
```json
{
  "status": "resolved",
  "incident_text": "I was charged twice on my credit card for order #49201",
  "user_name": "Alice",
  "predicted_intent": "payment_failed",
  "confidence": 0.88,
  "knowledge_title": "Duplicate Charges on Payment Card",
  "response": "Hello Alice,\n\nI understand you're seeing duplicate charges for your order. Rest assured...",
  "retrieved_articles": [
    {
      "title": "Duplicate Charges on Payment Card",
      "category": "payment_failed",
      "similarity": 0.82
    }
  ],
  "rag_enabled": true
}
```

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
