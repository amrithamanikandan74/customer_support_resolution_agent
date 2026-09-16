import { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";

/* ══════════════════════════════════════════════
   HERO / ENTERPRISE SVG ICONS
   ══════════════════════════════════════════════ */

const TicketIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z" />
    <path d="M13 5v2m0 4v2m0 4v2" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
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

const ShieldCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const DatabaseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CpuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="15" x2="23" y2="15" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="15" x2="4" y2="15" />
  </svg>
);

const KeyIcon = () => (
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

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SpeakerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const BookOpenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const ThumbsUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const ThumbsDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* ══════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════ */
let ticketSeq = 101;
const nextTicketId = () => `Chat #${ticketSeq++}`;

const formatTime = (dateStr) => {
  if (!dateStr) return "Just now";
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

/* ══════════════════════════════════════════════
   SUPPORT KNOWLEDGE CATEGORIES
   ══════════════════════════════════════════════ */
const KNOWLEDGE_CATEGORIES = [
  {
    id: "account",
    title: "Login & Password Help",
    desc: "Help with signing in, password resets, and account locks",
    icon: <KeyIcon />,
    issues: [
      "I can't log in to my account",
      "Account locked after failed attempts",
    ],
  },
  {
    id: "billing",
    title: "Payments & Refunds",
    desc: "Double charges, failed payments, and refund requests",
    icon: <CreditCardIcon />,
    issues: [
      "My payment was charged twice",
      "Payment failed but money deducted",
    ],
  },
  {
    id: "orders",
    title: "Orders & Shipping",
    desc: "Package tracking, delivery status, and order updates",
    icon: <TruckIcon />,
    issues: [
      "My order hasn't arrived yet",
      "I want a refund for my order",
    ],
  },
  {
    id: "tech",
    title: "Website & Technical Issues",
    desc: "App crashes, 500 error messages, and website bugs",
    icon: <TerminalIcon />,
    issues: [
      "I'm getting an error on the website",
      "Website crashed during checkout",
    ],
  },
];

/* ══════════════════════════════════════════════
   WELCOME INTAKE HUB (Empty state dashboard)
   ══════════════════════════════════════════════ */
function IntakeHub({ onQuickTicket, onOpenKB }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = KNOWLEDGE_CATEGORIES.map((cat) => ({
    ...cat,
    issues: cat.issues.filter((iss) =>
      iss.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.issues.length > 0);

  return (
    <div className="intake-hub">
      {/* Overview Banner */}
      <div className="intake-hero-card">
        <div className="intake-hero-header">
          <button className="system-pill kb-link-btn" onClick={onOpenKB}>
            <BookOpenIcon /> Browse Help Articles (25 Topics)
          </button>
          <span className="system-pill success">
            <ShieldCheckIcon /> AI Support Ready
          </span>
        </div>
        <h1 className="intake-title">How can we help you today?</h1>
        <p className="intake-subtitle">
          Select a common topic below or type your question in the chat bar to get instant step-by-step help.
        </p>

        {/* Search Bar */}
        <div className="intake-search-wrapper">
          <SearchIcon />
          <input
            type="text"
            className="intake-search-input"
            placeholder="Search help topics (e.g. login, payment, refund, delivery)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      {/* System Metrics Bar */}
      <div className="metrics-bar">
        <div className="metric-box">
          <span className="metric-value">Instant</span>
          <span className="metric-title">Automated Answers</span>
        </div>
        <div className="metric-box">
          <span className="metric-value">Verified</span>
          <span className="metric-title">Official Help Guides</span>
        </div>
        <div className="metric-box">
          <span className="metric-value">24/7</span>
          <span className="metric-title">Always Available</span>
        </div>
        <div className="metric-box">
          <span className="metric-value">Human Help</span>
          <span className="metric-title">Escalation Ready</span>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="intake-section-title">
        {searchQuery ? `Matching Topics (${filteredCategories.length})` : "Common Help Topics"}
      </div>

      <div className="categories-grid">
        {filteredCategories.length === 0 ? (
          <div className="no-matches-box">No topics matching &quot;{searchQuery}&quot;. Try typing your question in the message box below.</div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.id} className="category-block">
              <div className="category-block-header">
                <div className="cat-icon">{cat.icon}</div>
                <div className="cat-meta">
                  <span className="cat-title">{cat.title}</span>
                  <span className="cat-desc-text">{cat.desc}</span>
                </div>
              </div>
              <div className="cat-issues-list">
                {cat.issues.map((issue, idx) => (
                  <button
                    key={idx}
                    className="cat-issue-btn"
                    onClick={() => onQuickTicket(issue)}
                  >
                    <span className="issue-arrow">→</span> {issue}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   KNOWLEDGE BASE MODAL EXPLORER
   ══════════════════════════════════════════════ */
function KnowledgeBaseModal({ onClose, onSelectArticle }) {
  const [kbArticles, setKbArticles] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setKbArticles([
      { id: "kb-001", title: "Cannot Log In — Invalid Credentials", category: "login_issue", content: "Verify you are entering the correct email and password. Try clearing browser cache or resetting your password." },
      { id: "kb-002", title: "Account Locked Due to Multiple Failed Login Attempts", category: "account_locked", content: "Accounts are temporarily locked for 15 minutes after 5 failed attempts for your security." },
      { id: "kb-003", title: "Duplicate Charges on Payment Card", category: "payment_failed", content: "Duplicate pending charges usually drop off your bank statement within 3 to 5 business days automatically." },
      { id: "kb-004", title: "Payment Failed But Bank Account Debited", category: "payment_failed", content: "Failed transactions are auto-reversed by your bank within 24 to 48 hours." },
      { id: "kb-005", title: "Requesting a Refund for an Order", category: "refund_request", content: "Refunds can be requested within 30 days of purchase for eligible products." },
      { id: "kb-006", title: "Order Delivery Delayed by Courier", category: "order_delay", content: "Logistics tracking updates sync every 24 hours as your shipment moves between regional hubs." },
      { id: "kb-007", title: "Website 500 Internal Server Error", category: "technical_error", content: "Try refreshing the page or using a private browsing window. Our tech team monitors and fixes server outages." },
      { id: "kb-008", title: "Resetting Forgotten Password via Email", category: "password_reset", content: "Enter your registered email on the password reset page to receive a 15-minute secure reset link." },
    ]);
  }, []);

  const filtered = kbArticles.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="kb-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="kb-modal-header">
          <div className="kb-title-group">
            <BookOpenIcon />
            <h2>Help Center Articles</h2>
            <span className="kb-count-tag">25 Articles</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}><CloseIcon /></button>
        </div>

        <div className="kb-search-bar">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search help articles (e.g. login, payment, refund)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="kb-articles-list">
          {filtered.map((art) => (
            <div key={art.id} className="kb-article-card">
              <div className="kb-card-top">
                <span className="kb-art-title">{art.title}</span>
              </div>
              <p className="kb-art-excerpt">{art.content}</p>
              <button
                className="kb-resolve-btn"
                onClick={() => {
                  onSelectArticle(art.title);
                  onClose();
                }}
              >
                Ask AI Agent About This Topic →
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN APPLICATION COMPONENT
   ══════════════════════════════════════════════ */
function App() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [currentInput, setCurrentInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState({});
  const [showKBModal, setShowKBModal] = useState(false);
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const activeConv = conversations.find((c) => c.id === activeConvId) || null;

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, loading]);

  const updateConv = useCallback((id, updater) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updater(c) } : c))
    );
  }, []);

  const createNewTicket = useCallback(() => {
    const ticketId = nextTicketId();
    const newConv = {
      id: ticketId,
      title: ticketId,
      createdAt: new Date().toISOString(),
      step: "ask_name",
      userName: "",
      messages: [
        {
          role: "assistant",
          content: "Hello! Welcome to Support. What is your name?",
        },
      ],
      resolutionData: null,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(ticketId);
    setCurrentInput("");
  }, []);

  const sendIssueToBackend = async (convId, issueText, name) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/resolve`, {
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
            content: data.response || "I have processed your request.",
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
              "We're having trouble connecting to the support server right now. Please ensure the backend is running and try again.",
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickTicket = useCallback((issueText) => {
    const ticketId = nextTicketId();
    const newConv = {
      id: ticketId,
      title: issueText.length > 28 ? issueText.slice(0, 28) + "..." : issueText,
      createdAt: new Date().toISOString(),
      step: "done",
      userName: "Customer",
      messages: [
        {
          role: "assistant",
          content: "Hello! Checking our official help guides to assist you right away...",
        },
        { role: "user", content: issueText },
      ],
      resolutionData: null,
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(ticketId);
    sendIssueToBackend(ticketId, issueText, "Customer");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = (text, msgIdx) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgIdx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text, msgIdx) => {
    if (!("speechSynthesis" in window)) return;
    if (speakingMsgIndex === msgIdx) {
      window.speechSynthesis.cancel();
      setSpeakingMsgIndex(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingMsgIndex(null);
    setSpeakingMsgIndex(msgIdx);
    window.speechSynthesis.speak(utterance);
  };

  const handleExport = () => {
    if (!activeConv) return;
    const content = `================================================
SUPPORT CHAT SUMMARY
Reference: ${activeConv.id}
Customer Name: ${activeConv.userName || "Customer"}
Status: ${activeConv.resolutionData?.status === "resolved" ? "Solved" : "Escalated to Human Agent"}
Date: ${new Date().toLocaleString()}
================================================

CHAT HISTORY:
${activeConv.messages.map((m) => `[${m.role === "assistant" ? "AI Agent" : "Customer"}]: ${m.content}`).join("\n\n")}
`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Support_${activeConv.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSend = async () => {
    if (!currentInput.trim() || loading || !activeConv) return;
    const value = currentInput.trim();
    setCurrentInput("");

    if (activeConv.step === "ask_name") {
      updateConv(activeConv.id, (c) => ({
        step: "ask_issue",
        userName: value,
        title: `Chat with ${value}`,
        messages: [
          ...c.messages,
          { role: "user", content: value },
          {
            role: "assistant",
            content: `Nice to meet you, ${value}! How can we help you today?`,
          },
        ],
      }));
    } else if (activeConv.step === "ask_issue") {
      updateConv(activeConv.id, (c) => ({
        step: "processing",
        messages: [...c.messages, { role: "user", content: value }],
      }));
      sendIssueToBackend(activeConv.id, value, activeConv.userName);
    }
  };

  return (
    <div className="workspace-container">
      {/* ── KNOWLEDGE BASE MODAL ── */}
      {showKBModal && (
        <KnowledgeBaseModal
          onClose={() => setShowKBModal(false)}
          onSelectArticle={(title) => handleQuickTicket(title)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className="workspace-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo"><CpuIcon /></div>
          <div className="brand-text">
            <span className="brand-name">Help & Support</span>
            <span className="brand-tag">24/7 AI Assistant</span>
          </div>
        </div>

        <button className="new-ticket-btn" onClick={createNewTicket}>
          <PlusIcon /> Start New Chat
        </button>

        <button className="browse-kb-sidebar-btn" onClick={() => setShowKBModal(true)}>
          <BookOpenIcon /> Browse Help Articles (25 Topics)
        </button>

        <div className="sidebar-section-header">Recent Chats ({conversations.length})</div>

        <div className="tickets-list">
          {conversations.length === 0 ? (
            <div className="no-tickets-msg">No recent chats yet.</div>
          ) : (
            conversations.map((c) => {
              const isSelected = c.id === activeConvId;
              const status = c.resolutionData?.status || (c.step === "done" ? "resolved" : "open");
              return (
                <div
                  key={c.id}
                  className={`ticket-nav-item ${isSelected ? "active" : ""}`}
                  onClick={() => setActiveConvId(c.id)}
                >
                  <div className="ticket-nav-top">
                    <span className="ticket-nav-id">{c.title || c.id}</span>
                    <span className={`status-tag ${status}`}>
                      {status === "resolved" ? "Solved" : status === "escalated" ? "Escalated" : "Open"}
                    </span>
                  </div>
                  <div className="ticket-nav-title">{c.userName ? `Customer: ${c.userName}` : "New Chat"}</div>
                </div>
              );
            })
          )}
        </div>

        <div className="sidebar-footer-box">
          <span className="connection-dot" />
          AI Support Online
        </div>
      </aside>

      {/* ── MAIN WORKSPACE PANEL ── */}
      <main className="workspace-main">
        {/* Workspace Top Navigation Bar */}
        <header className="workspace-topbar">
          <div className="topbar-left">
            <span className="topbar-title">
              {activeConv ? activeConv.title : "Customer Support Help Center"}
            </span>
            {activeConv?.userName && (
              <span className="topbar-user-badge"><UserIcon /> {activeConv.userName}</span>
            )}
          </div>
          <div className="topbar-right">
            {activeConv && (
              <button className="export-report-btn" onClick={handleExport} title="Save Chat Summary">
                <DownloadIcon /> Save Summary
              </button>
            )}
            {activeConv?.resolutionData && (
              <>
                <span className="meta-tag intent">
                  Topic: {activeConv.resolutionData.predicted_intent?.replace("_", " ").toUpperCase()}
                </span>
                <span className="meta-tag conf">
                  Confidence: {Math.round((activeConv.resolutionData.confidence || 0) * 100)}%
                </span>
              </>
            )}
          </div>
        </header>

        {/* Content View */}
        {!activeConv ? (
          <IntakeHub
            onQuickTicket={handleQuickTicket}
            onOpenKB={() => setShowKBModal(true)}
          />
        ) : (
          <div className="ticket-view-container">
            <div className="messages-scroll-area">
              {activeConv.messages.map((msg, index) => (
                <div key={index} className={`message-row ${msg.role}`}>
                  <div className="msg-avatar">
                    {msg.role === "assistant" ? <CpuIcon /> : <UserIcon />}
                  </div>
                  <div className="msg-content-wrapper">
                    <div className="msg-header-info">
                      <span className="msg-sender">
                        {msg.role === "assistant" ? "AI Support Agent" : activeConv.userName || "Customer"}
                      </span>
                      <span className="msg-time">{formatTime(msg.timestamp)}</span>

                      {/* Action Bar for Assistant Messages */}
                      {msg.role === "assistant" && (
                        <div className="msg-actions-bar">
                          <button
                            className="msg-action-btn"
                            onClick={() => handleCopy(msg.content, index)}
                            title="Copy text"
                          >
                            {copiedId === index ? <CheckIcon /> : <CopyIcon />}
                            {copiedId === index ? "Copied" : "Copy"}
                          </button>
                          <button
                            className={`msg-action-btn ${speakingMsgIndex === index ? "active" : ""}`}
                            onClick={() => handleSpeak(msg.content, index)}
                            title="Listen to response"
                          >
                            <SpeakerIcon />
                            {speakingMsgIndex === index ? "Stop" : "Listen"}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="msg-bubble">{msg.content}</div>

                    {/* Feedback Rating */}
                    {msg.role === "assistant" && msg.meta && (
                      <div className="msg-feedback-bar">
                        <span className="feedback-label">Was this answer helpful?</span>
                        <button
                          className={`feedback-btn ${feedback[index] === "up" ? "selected-up" : ""}`}
                          onClick={() => setFeedback((f) => ({ ...f, [index]: "up" }))}
                        >
                          <ThumbsUpIcon /> Yes
                        </button>
                        <button
                          className={`feedback-btn ${feedback[index] === "down" ? "selected-down" : ""}`}
                          onClick={() => setFeedback((f) => ({ ...f, [index]: "down" }))}
                        >
                          <ThumbsDownIcon /> I need human agent help
                        </button>
                      </div>
                    )}

                    {/* Simple Source Reference Box */}
                    {msg.meta && (
                      <div className="rag-inspection-card">
                        <div className="rag-card-header">
                          <span className="rag-card-title"><DatabaseIcon /> RELEVANT OFFICIAL HELP ARTICLES</span>
                          <span className="rag-tag">Verified Help Guide</span>
                        </div>
                        {msg.meta.retrieved_articles && msg.meta.retrieved_articles.length > 0 && (
                          <div className="rag-articles-group">
                            {msg.meta.retrieved_articles.map((art, i) => (
                              <div key={i} className="rag-article-row">
                                <span className="art-title">{art.title}</span>
                                <span className="art-score">{Math.round((art.similarity || 0) * 100)}% Match</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message-row assistant">
                  <div className="msg-avatar"><CpuIcon /></div>
                  <div className="msg-bubble loading">
                    Checking official help guides & preparing answer...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            {activeConv.step !== "done" && (
              <div className="workspace-input-bar">
                <input
                  ref={inputRef}
                  type="text"
                  className="workspace-input"
                  placeholder={
                    activeConv.step === "ask_name"
                      ? "Enter your name..."
                      : "Type your question here..."
                  }
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button
                  className="send-btn"
                  onClick={handleSend}
                  disabled={!currentInput.trim() || loading}
                >
                  <SendIcon /> Send
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;