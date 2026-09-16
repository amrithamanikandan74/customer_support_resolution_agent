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

const ClearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4m0 12v4m-7-7H1m22 0h-4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
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

/* ══════════════════════════════════════════════
   HELPER: generate unique IDs
   ══════════════════════════════════════════════ */
let nextId = 1;
const uid = () => `conv-${nextId++}`;

/* ══════════════════════════════════════════════
   HELPER: format time
   ══════════════════════════════════════════════ */
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
   RESOLUTION METADATA
   ══════════════════════════════════════════════ */
function ResolutionMeta({ data }) {
  if (!data) return null;
  const { status, predicted_intent, confidence, retrieved_articles, rag_enabled } = data;
  const pct = confidence != null ? Math.round(confidence * 100) : null;
  const intentLabel = predicted_intent
    ? predicted_intent.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : null;

  return (
    <div className="resolution-meta">
      <div className="meta-header">
        <span className="meta-title">Resolution Details</span>
        {rag_enabled && <span className="rag-pill">⚡ RAG Powered</span>}
      </div>

      {status && (
        <div className="meta-row">
          <span className="meta-label">Status</span>
          <span className={`meta-badge ${status}`}>
            {status === "resolved" ? "✓ Resolved" : "⚠ Escalated"}
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
      {/* ── System Banner ── */}
      <div className="welcome-hero">
        <div className="welcome-hero-badge">
          <span className="live-status-dot" />
          ChromaDB RAG Engine Connected • 25 Knowledge Articles
        </div>
        <h1 className="welcome-hero-title">Customer Support Resolution Hub</h1>
        <p className="welcome-hero-desc">
          Select a common incident category below or type your inquiry into the chat to start an instant automated resolution grounded in our vector knowledge base.
        </p>
      </div>

      {/* ── Metrics Grid ── */}
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
          <span className="metric-icon">📚</span>
          <div className="metric-info">
            <span className="metric-value">25 Articles</span>
            <span className="metric-label">Vector Knowledge Index</span>
          </div>
        </div>
        <div className="metric-card">
          <span className="metric-icon">🤖</span>
          <div className="metric-info">
            <span className="metric-value">Gemini 2.0</span>
            <span className="metric-label">Generative AI Engine</span>
          </div>
        </div>
      </div>

      {/* ── Knowledge Categories Grid ── */}
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
  };
}

function App() {
  /* ── Conversation state ── */
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── Derived active conversation ── */
  const activeConv = conversations.find((c) => c.id === activeConvId) || null;

  /* ── Transient input state ── */
  const [currentInput, setCurrentInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, loading]);

  // Auto-focus
  useEffect(() => {
    if (activeConv && activeConv.step !== "done") {
      inputRef.current?.focus();
    }
  }, [activeConv?.step, activeConvId]);

  /* ── Update a conversation in state ── */
  const updateConv = useCallback((id, updater) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updater(c) } : c))
    );
  }, []);

  /* ── Create new conversation ── */
  const handleNewConversation = useCallback(() => {
    const conv = createFreshConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveConvId(conv.id);
    setCurrentInput("");
    setLoading(false);
    setSidebarOpen(false);
  }, []);

  /* ── Switch conversation ── */
  const handleSwitchConversation = useCallback((id) => {
    setActiveConvId(id);
    setCurrentInput("");
    setLoading(false);
    setSidebarOpen(false);
  }, []);

  /* ── Delete conversation ── */
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

  /* ── Quick issue from welcome screen ── */
  const handleQuickIssue = useCallback(
    (issue) => {
      // Create a conversation, set name to "Customer", jump to ask_issue, then auto-send
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

      // Fire the API call
      sendIssueToBackend(conv.id, issue, "Customer");
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /* ── Send issue to backend (extracted for reuse) ── */
  const sendIssueToBackend = async (convId, issueText, name) => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_text: issueText,
          user_name: name || "Customer",
        }),
      });
      const data = await response.json();
      updateConv(convId, (c) => ({
        step: "done",
        resolutionData: data,
        messages: [
          ...c.messages,
          {
            role: "assistant",
            content: data.response || "No response received.",
            meta: data,
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

  /* ── Handle send ── */
  const handleSend = async () => {
    if (!currentInput.trim() || loading || !activeConv) return;
    const value = currentInput.trim();
    const convId = activeConv.id;

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

    if (activeConv.step === "ask_issue") {
      // Update title to the issue text
      const title =
        value.length > 35 ? value.slice(0, 35) + "…" : value;
      updateConv(convId, (c) => ({
        title,
        messages: [...c.messages, { role: "user", content: value }],
      }));
      setCurrentInput("");
      await sendIssueToBackend(convId, value, activeConv.userName);
    }
  };

  /* ── Computed values ── */
  const step = activeConv?.step || null;
  const messages = activeConv?.messages || [];

  const getPlaceholder = () => {
    if (!activeConv) return "Start a new conversation…";
    if (step === "ask_name") return "Enter your name…";
    if (step === "ask_issue") return "Describe your issue…";
    return "Session ended";
  };

  const headerTitle = activeConv
    ? activeConv.title
    : "Customer Support";

  return (
    <div className="app-layout">
      {/* ── Sidebar overlay (mobile) ── */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ══════ SIDEBAR ══════ */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Branding */}
        <div className="sidebar-header">
          <div className="sidebar-logo"><HeadsetIcon /></div>
          <div className="sidebar-brand">
            <span className="sidebar-brand-name">SupportAI</span>
            <span className="sidebar-brand-tag">Resolution Agent</span>
          </div>
        </div>

        {/* New conversation */}
        <button className="new-conv-btn" onClick={handleNewConversation}>
          <PlusIcon /> New Conversation
        </button>

        {/* Conversation list */}
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

        {/* Quick actions */}
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

        {/* Footer */}
        <div className="sidebar-footer">
          <span className="sidebar-footer-text">
            <span className="powered-dot" />
            Powered by AI Resolution Engine
          </span>
        </div>
      </aside>

      {/* ══════ MAIN PANEL ══════ */}
      <main className="main-panel">
        {/* Header bar */}
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
            <div className="header-status-pill">
              <span className="status-dot" />
              Online
            </div>
          </div>
        </div>

        {/* Chat content */}
        <div className="chat-content">
          {!activeConv ? (
            /* ── Welcome / empty state ── */
            <WelcomeState onQuickIssue={handleQuickIssue} />
          ) : (
            <>
              {/* ── Messages ── */}
              <div className="message-area">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`message-row ${msg.role}`}
                    style={{ animationDelay: `${Math.min(i * 0.06, 0.3)}s` }}
                  >
                    {msg.role === "assistant" && (
                      <div className="msg-avatar"><HeadsetIcon /></div>
                    )}
                    <div className={`message-bubble ${msg.role}`}>
                      {msg.content}
                      {msg.meta && <ResolutionMeta data={msg.meta} />}
                    </div>
                  </div>
                ))}

                {loading && <TypingIndicator />}

                {step === "done" && !loading && (
                  <div className="new-chat-wrapper">
                    <button className="new-chat-btn" onClick={handleNewConversation}>
                      ✦ Start New Conversation
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── Input ── */}
              <div className="input-area">
                <input
                  ref={inputRef}
                  className="input-field"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  placeholder={getPlaceholder()}
                  disabled={step === "done" || loading}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  className="send-btn"
                  onClick={handleSend}
                  disabled={loading || step === "done"}
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