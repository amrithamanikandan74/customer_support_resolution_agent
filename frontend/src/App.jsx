import { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";

/* ══════════════════════════════════════════════
   SVG ICONS
   ══════════════════════════════════════════════ */

const HeadsetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const UserKeyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-2-2l2 2m2 0l-3 3m-3-3l3 3M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 0v9m0 0l-3-3m3 3l3-3" />
  </svg>
);

const CreditCardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const RefundIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

const TruckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const TerminalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const ShieldLockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <rect x="9" y="11" width="6" height="5" rx="1" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

/* ══════════════════════════════════════════════
   HELPER: generate unique IDs & format time
   ══════════════════════════════════════════════ */
let nextId = 1;
const uid = () => `conv-${nextId++}`;

const formatTime = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diff = now - d;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
};

/* ══════════════════════════════════════════════
   TYPING INDICATOR
   ══════════════════════════════════════════════ */
function TypingIndicator() {
  return (
    <div className="typing-indicator-row">
      <div className="msg-avatar"><HeadsetIcon /></div>
      <div className="typing-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   HUMAN HANDOFF & ESCALATION CARD
   ══════════════════════════════════════════════ */
function HandOffCard({ convId, userName, incidentText, predictedIntent, onSubmitted }) {
  const [email, setEmail] = useState("");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/escalate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: userName || "Customer",
          email: email.trim(),
          incident_text: incidentText || "Human escalation request",
          predicted_intent: predictedIntent || "",
          priority: priority,
          conversation_id: convId || "",
        }),
      });
      const data = await res.json();
      setSubmittedResult(data);
      if (onSubmitted) onSubmitted(data);
    } catch {
      setSubmittedResult({
        ticket_ref: "ERR",
        message: "Failed to connect to backend server.",
        expect_reply_within_hours: 24,
      });
    } finally {
      setLoading(false);
    }
  };

  if (submittedResult) {
    return (
      <div className="handoff-card submitted">
        <div className="handoff-badge">✅ Handed Over — Ticket {submittedResult.ticket_ref}</div>
        <p className="handoff-msg">{submittedResult.message}</p>
      </div>
    );
  }

  return (
    <div className="handoff-card">
      <div className="handoff-header">
        <span className="handoff-title">🤝 Get a Person on This</span>
        <span className="handoff-sub">Human Specialist Escalation</span>
      </div>
      <p className="handoff-desc">
        Leave an email address and a colleague picks it up, with everything you've said so far attached.
      </p>
      <form onSubmit={handleSubmit} className="handoff-form">
        <div className="form-group">
          <input
            type="email"
            required
            className="handoff-email-input"
            placeholder="Enter your email address…"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="sla-toggle-group">
          <label className={`sla-option ${priority === "normal" ? "selected" : ""}`}>
            <input
              type="radio"
              name="priority"
              value="normal"
              checked={priority === "normal"}
              onChange={() => setPriority("normal")}
            />
            <span>Standard reply (within 24 hours)</span>
          </label>
          <label className={`sla-option ${priority === "urgent" ? "selected" : ""}`}>
            <input
              type="radio"
              name="priority"
              value="urgent"
              checked={priority === "urgent"}
              onChange={() => setPriority("urgent")}
            />
            <span>⚡ Time-sensitive (reply within 4 hours instead of 24)</span>
          </label>
        </div>
        <button type="submit" className="handoff-submit-btn" disabled={loading}>
          {loading ? "Handing over…" : "Hand it over"}
        </button>
      </form>
    </div>
  );
}

/* ══════════════════════════════════════════════
   RESOLUTION METADATA
   ══════════════════════════════════════════════ */
function ResolutionMeta({ data }) {
  if (!data) return null;
  const { status, predicted_intent, confidence, retrieved_articles, rag_enabled, language } = data;
  const pct = confidence != null ? Math.round(confidence * 100) : null;
  const intentLabel = predicted_intent
    ? predicted_intent.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  return (
    <div className="resolution-meta">
      <div className="meta-header">
        <span className="meta-title">Resolution Details</span>
        {language && language !== "English" && (
          <span className="lang-pill">🌐 {language}</span>
        )}
        {rag_enabled && <span className="rag-pill">⚡ RAG Powered</span>}
      </div>

      {status && (
        <div className="meta-row">
          <span className="meta-label">Status</span>
          <span className={`meta-badge ${status}`}>
            {status === "resolved" ? "✓ Resolved" : "⚠ Escalated to Human"}
          </span>
        </div>
      )}

      {intentLabel && (
        <div className="meta-row">
          <span className="meta-label">Intent</span>
          <span className="meta-value">{intentLabel}</span>
        </div>
      )}

      {pct != null && (
        <div className="meta-row">
          <span className="meta-label">Confidence</span>
          <div className="confidence-bar-container">
            <div className="confidence-bar">
              <div className="confidence-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="meta-value">{pct}%</span>
          </div>
        </div>
      )}

      {retrieved_articles && retrieved_articles.length > 0 && (
        <div className="meta-articles-section">
          <span className="meta-label">Retrieved Knowledge Articles</span>
          <div className="retrieved-articles-list">
            {retrieved_articles.map((art, idx) => (
              <div key={art.id || idx} className="article-item">
                <span className="article-title">{art.title}</span>
                {art.similarity != null && (
                  <span className="article-match">
                    {Math.round(art.similarity * 100)}% match
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   WELCOME STATE (Rich Knowledge & Category Dashboard)
   ══════════════════════════════════════════════ */
const KNOWLEDGE_CATEGORIES = [
  {
    id: "account",
    title: "Account & Access",
    desc: "Login credentials, account locks, SSO and authentication",
    icon: <UserKeyIcon />,
    issues: [
      "I can't log in to my account",
      "Account locked after failed attempts",
    ],
  },
  {
    id: "billing",
    title: "Billing & Payments",
    desc: "Failed checkout, double charges, receipts and card errors",
    icon: <CreditCardIcon />,
    issues: [
      "My payment was charged twice",
      "Payment failed but money deducted",
    ],
  },
  {
    id: "orders",
    title: "Orders & Refunds",
    desc: "Order returns, refund timelines, item exchanges",
    icon: <RefundIcon />,
    issues: [
      "I want a refund for my order",
      "How long does a refund process take?",
    ],
  },
  {
    id: "shipping",
    title: "Shipping & Logistics",
    desc: "Package tracking, courier delays, delivery updates",
    icon: <TruckIcon />,
    issues: [
      "My order hasn't arrived yet",
      "Track my shipment package status",
    ],
  },
  {
    id: "tech",
    title: "System & Tech Errors",
    desc: "Website crashes, 500 server codes, page load bugs",
    icon: <TerminalIcon />,
    issues: [
      "I'm getting an error on the website",
      "Website crashed during checkout",
    ],
  },
  {
    id: "security",
    title: "Security & 2FA",
    desc: "Password reset policies, two-factor setup, privacy",
    icon: <ShieldLockIcon />,
    issues: [
      "How do I reset my password?",
      "Enable two-factor authentication",
    ],
  },
];

function WelcomeState({ onQuickIssue }) {
  return (
    <div className="welcome-dashboard">
      <div className="welcome-hero">
        <div className="welcome-hero-badge">
          <span className="live-status-dot" />
          ChromaDB RAG Engine Connected • Multilingual AI Ready
        </div>
        <h1 className="welcome-hero-title">Customer Support Resolution Hub</h1>
        <p className="welcome-hero-desc">
          Select a common incident category below or type your inquiry into the chat to start an instant automated resolution grounded in our vector knowledge base.
        </p>
      </div>

      <div className="welcome-metrics-grid">
        <div className="metric-card">
          <span className="metric-icon">⚡</span>
          <div className="metric-info">
            <span className="metric-value">&lt; 1.2s</span>
            <span className="metric-label">Avg Resolution Time</span>
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-icon">🎯</span>
          <div className="metric-info">
            <span className="metric-value">100%</span>
            <span className="metric-label">RCA Guardrail Checks</span>
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-icon">🌐</span>
          <div className="metric-info">
            <span className="metric-value">5 Languages</span>
            <span className="metric-label">EN, ES, FR, DE, HI</span>
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-icon">🤝</span>
          <div className="metric-info">
            <span className="metric-value">Human Escalation</span>
            <span className="metric-label">4h Urgent SLA Option</span>
          </div>
        </div>
      </div>

      <div className="welcome-categories-header">
        <span className="section-title">Common Resolution Scenarios</span>
        <span className="section-subtitle">Click any sample query to launch a resolution</span>
      </div>

      <div className="welcome-category-grid">
        {KNOWLEDGE_CATEGORIES.map((cat) => (
          <div key={cat.id} className="category-card">
            <div className="category-card-header">
              <div className="category-icon-wrapper">{cat.icon}</div>
              <div className="category-title-block">
                <h3 className="category-title">{cat.title}</h3>
                <p className="category-desc">{cat.desc}</p>
              </div>
            </div>
            <div className="category-chips">
              {cat.issues.map((issue, idx) => (
                <button
                  key={idx}
                  className="category-chip-btn"
                  onClick={() => onQuickIssue(issue)}
                >
                  <span className="chip-bullet">›</span> {issue}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN APP
   ══════════════════════════════════════════════ */

function createFreshConversation() {
  return {
    id: uid(),
    title: "New Conversation",
    createdAt: new Date().toISOString(),
    step: "ask_name",
    userName: "",
    messages: [
      {
        role: "assistant",
        content: "Hello! I'm your AI support assistant. What's your name?",
      },
    ],
    resolutionData: null,
    showHandoff: false,
  };
}

function App() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [feedbackGiven, setFeedbackGiven] = useState({});

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;

  const [currentInput, setCurrentInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, loading, activeConv?.showHandoff]);

  useEffect(() => {
    if (activeConv && activeConv.step !== "done") {
      inputRef.current?.focus();
    }
  }, [activeConv?.step, activeConvId]);

  const updateConv = useCallback((id, updater) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updater(c) } : c))
    );
  }, []);

  const handleNewConversation = useCallback(() => {
    const conv = createFreshConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveConvId(conv.id);
    setCurrentInput("");
    setLoading(false);
    setSidebarOpen(false);
  }, []);

  const handleSwitchConversation = useCallback((id) => {
    setActiveConvId(id);
    setCurrentInput("");
    setLoading(false);
    setSidebarOpen(false);
  }, []);

  const handleDeleteConversation = useCallback(
    (id, e) => {
      e.stopPropagation();
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
      }
    },
    [activeConvId]
  );

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const sendIssueToBackend = async (convId, issueText, name, lang = selectedLanguage) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_text: issueText,
          user_name: name || "Customer",
          language: lang,
          conversation_id: convId,
        }),
      });
      const data = await response.json();
      const isEscalated = data.status === "escalated";

      updateConv(convId, (c) => ({
        step: "done",
        resolutionData: data,
        showHandoff: isEscalated || c.showHandoff,
        messages: [
          ...c.messages,
          {
            role: "assistant",
            content: data.response || "No response received.",
            meta: data,
            suggestedReplies: data.suggested_replies || (isEscalated ? ["Put me through to a person", "Here's more detail"] : []),
          },
        ],
      }));
    } catch {
      updateConv(convId, (c) => ({
        step: "done",
        messages: [
          ...c.messages,
          {
            role: "assistant",
            content:
              "I'm unable to connect to the resolution service right now. Please ensure the backend server is running and try again.",
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickIssue = useCallback(
    (issue) => {
      const conv = createFreshConversation();
      conv.step = "ask_issue";
      conv.userName = "Customer";
      conv.title = issue.length > 35 ? issue.slice(0, 35) + "…" : issue;
      conv.messages = [
        {
          role: "assistant",
          content:
            "Hello! I'm your AI support assistant. Let me look into that for you right away.",
        },
        { role: "user", content: issue },
      ];
      setConversations((prev) => [conv, ...prev]);
      setActiveConvId(conv.id);
      setCurrentInput("");
      setSidebarOpen(false);

      sendIssueToBackend(conv.id, issue, "Customer", selectedLanguage);
    },
    [selectedLanguage]
  );

  const handleSend = async (overrideText = null) => {
    const value = (overrideText !== null ? overrideText : currentInput).trim();
    if (!value || loading || !activeConv) return;
    const convId = activeConv.id;

    if (value === "Put me through to a person" || value === "Get a person on this") {
      updateConv(convId, (c) => ({
        showHandoff: true,
        messages: [
          ...c.messages,
          { role: "user", content: value },
          {
            role: "assistant",
            content: "I've opened the human specialist handoff form for you below. Please enter your email and specify if your request is time-sensitive.",
          },
        ],
      }));
      setCurrentInput("");
      return;
    }

    if (activeConv.step === "ask_name") {
      updateConv(convId, (c) => ({
        step: "ask_issue",
        userName: value,
        title: `Chat with ${value}`,
        messages: [
          ...c.messages,
          { role: "user", content: value },
          {
            role: "assistant",
            content: `Great to meet you, ${value}! How can I help you today? Please describe the issue you're experiencing.`,
          },
        ],
      }));
      setCurrentInput("");
      return;
    }

    if (activeConv.step === "ask_issue" || activeConv.step === "done") {
      const title = activeConv.title === "New Conversation"
        ? (value.length > 35 ? value.slice(0, 35) + "…" : value)
        : activeConv.title;

      updateConv(convId, (c) => ({
        title,
        step: "ask_issue",
        messages: [...c.messages, { role: "user", content: value }],
      }));
      setCurrentInput("");
      await sendIssueToBackend(convId, value, activeConv.userName, selectedLanguage);
    }
  };

  const handleFeedback = (msgIdx, helpful, meta) => {
    const key = `${activeConvId}-${msgIdx}`;
    setFeedbackGiven((prev) => ({ ...prev, [key]: helpful ? "yes" : "no" }));
    if (!helpful) {
      updateConv(activeConvId, (c) => ({ showHandoff: true }));
    }
    fetch(`${API_BASE_URL}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        helpful,
        conversation_id: activeConvId,
        incident_text: meta?.incident_text || "",
        predicted_intent: meta?.predicted_intent || "",
        confidence: meta?.confidence,
      }),
    }).catch(() => {});
  };

  const step = activeConv?.step || null;
  const messages = activeConv?.messages || [];

  const getPlaceholder = () => {
    if (!activeConv) return "Start a new conversation…";
    if (step === "ask_name") return "Enter your name…";
    if (step === "ask_issue") return "Describe your issue…";
    return "Type a follow-up message…";
  };

  const headerTitle = activeConv ? activeConv.title : "Customer Support";

  return (
    <div className="app-layout">
      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ══════ SIDEBAR ══════ */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo"><HeadsetIcon /></div>
          <div className="sidebar-brand">
            <span className="sidebar-brand-name">SupportAI</span>
            <span className="sidebar-brand-tag">Resolution Agent</span>
          </div>
        </div>

        <button className="new-conv-btn" onClick={handleNewConversation}>
          <PlusIcon /> New Conversation
        </button>

        <span className="sidebar-section-label">Recent Chats</span>
        <div className="conversation-list">
          {conversations.length === 0 ? (
            <div className="conv-empty">
              <div className="conv-empty-icon">💬</div>
              <p className="conv-empty-text">
                No conversations yet.<br />Start one above!
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conv-item ${conv.id === activeConvId ? "active" : ""}`}
                onClick={() => handleSwitchConversation(conv.id)}
              >
                <span
                  className={`conv-dot ${conv.step === "done" ? "ended" : "active"}`}
                />
                <div className="conv-info">
                  <div className="conv-title">{conv.title}</div>
                  <div className="conv-time">{formatTime(conv.createdAt)}</div>
                </div>
                <button
                  className="conv-delete-btn"
                  onClick={(e) => handleDeleteConversation(conv.id, e)}
                  aria-label="Delete conversation"
                >
                  <TrashIcon />
                </button>
              </div>
            ))
          )}
        </div>

        <span className="sidebar-section-label">Quick Actions</span>
        <div className="quick-actions">
          <button className="quick-action-btn" onClick={handleNewConversation}>
            <span className="quick-action-icon">🆕</span> Start Fresh Chat
          </button>
          <button
            className="quick-action-btn"
            onClick={() => {
              setConversations([]);
              setActiveConvId(null);
            }}
          >
            <span className="quick-action-icon">🗑️</span> Clear All History
          </button>
        </div>

        <div className="sidebar-footer">
          <span className="sidebar-footer-text">
            <span className="powered-dot" />
            Powered by AI Resolution Engine
          </span>
        </div>
      </aside>

      {/* ══════ MAIN PANEL ══════ */}
      <main className="main-panel">
        <div className="main-header">
          <div className="main-header-left">
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              <MenuIcon />
            </button>
            <span className="main-header-title">
              {headerTitle}
              {activeConv && activeConv.userName && (
                <span className="main-header-subtitle">
                  — {activeConv.userName}
                </span>
              )}
            </span>
          </div>

          <div className="main-header-right">
            {/* Language Selector Dropdown */}
            <div className="language-selector-wrapper">
              <GlobeIcon />
              <select
                className="language-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
              >
                <option value="English">English</option>
                <option value="Spanish">Español</option>
                <option value="French">Français</option>
                <option value="German">Deutsch</option>
                <option value="Hindi">हिंदी</option>
              </select>
            </div>

            <div className="header-status-pill">
              <span className="status-dot" />
              Online
            </div>
          </div>
        </div>

        {/* Chat content */}
        <div className="chat-content">
          {!activeConv ? (
            <WelcomeState onQuickIssue={handleQuickIssue} />
          ) : (
            <>
              <div className="message-area">
                {messages.map((msg, i) => {
                  const fbKey = `${activeConvId}-${i}`;
                  const fb = feedbackGiven[fbKey];
                  return (
                    <div
                      key={i}
                      className={`message-row ${msg.role}`}
                      style={{ animationDelay: `${Math.min(i * 0.06, 0.3)}s` }}
                    >
                      {msg.role === "assistant" && (
                        <div className="msg-avatar"><HeadsetIcon /></div>
                      )}
                      <div className="message-bubble-group">
                        <div className={`message-bubble ${msg.role}`}>
                          {msg.content}
                          {msg.meta && <ResolutionMeta data={msg.meta} />}
                        </div>

                        {/* Interactive feedback & suggested reply chips */}
                        {msg.role === "assistant" && msg.meta && (
                          <div className="assistant-action-row">
                            <div className="feedback-block">
                              <span className="feedback-label">Did that sort it?</span>
                              {fb ? (
                                <span className="feedback-done-badge">
                                  {fb === "yes" ? "✓ Resolved" : "⚠ Flagged for Specialist"}
                                </span>
                              ) : (
                                <div className="feedback-btns">
                                  <button
                                    className="feedback-btn yes"
                                    onClick={() => handleFeedback(i, true, msg.meta)}
                                  >
                                    Yes
                                  </button>
                                  <button
                                    className="feedback-btn no"
                                    onClick={() => handleFeedback(i, false, msg.meta)}
                                  >
                                    Not really
                                  </button>
                                </div>
                              )}
                            </div>

                            {msg.suggestedReplies && msg.suggestedReplies.length > 0 && (
                              <div className="suggested-chips">
                                {msg.suggestedReplies.map((reply, rIdx) => (
                                  <button
                                    key={rIdx}
                                    className="suggested-chip-btn"
                                    onClick={() => handleSend(reply)}
                                  >
                                    {reply}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {loading && <TypingIndicator />}

                {/* Handoff card if escalated or user requested */}
                {activeConv.showHandoff && (
                  <HandOffCard
                    convId={activeConv.id}
                    userName={activeConv.userName}
                    incidentText={activeConv.resolutionData?.incident_text}
                    predictedIntent={activeConv.resolutionData?.predicted_intent}
                    onSubmitted={() => {
                      updateConv(activeConv.id, (c) => ({
                        messages: [
                          ...c.messages,
                          {
                            role: "assistant",
                            content: "Thank you. Your ticket has been dispatched to our support team and attached with full context. A colleague will follow up via email.",
                          },
                        ],
                      }));
                    }}
                  />
                )}

                {step === "done" && !loading && (
                  <div className="new-chat-wrapper">
                    <button className="new-chat-btn" onClick={handleNewConversation}>
                      ✦ Start New Conversation
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="input-area">
                <input
                  ref={inputRef}
                  className="input-field"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder={getPlaceholder()}
                  disabled={loading}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  className="send-btn"
                  onClick={() => handleSend()}
                  disabled={loading || !currentInput.trim()}
                  aria-label="Send message"
                >
                  <SendIcon />
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;