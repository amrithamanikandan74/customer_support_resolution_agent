import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import "./App.css";

/* ──────────────────────────────────────────
   Icons
   ────────────────────────────────────────── */
const I = (p) => ({
  viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", ...p,
});
const Plus = () => <svg {...I()}><path d="M12 5v14M5 12h14" /></svg>;
const Book = () => <svg {...I()}><path d="M4 4h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2H4z" /><path d="M20 4h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2H20z" /></svg>;
const Find = () => <svg {...I()}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></svg>;
const Send = () => <svg {...I()}><path d="M12 19V5M5 12l7-7 7 7" /></svg>;
const Copy = () => <svg {...I()}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
const Tick = () => <svg {...I()}><path d="m20 6-11 11-5-5" /></svg>;
const Speak = () => <svg {...I()}><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M16 9a4 4 0 0 1 0 6" /></svg>;
const Save = () => <svg {...I()}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10.5 12 15l5-4.5M12 15V3" /></svg>;
const Close = () => <svg {...I()}><path d="M18 6 6 18M6 6l12 12" /></svg>;
const Menu = () => <svg {...I()}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
const Why = () => <svg {...I()}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.5.2-.7.6-.7 1.1v.5" /><path d="M12 17h.01" /></svg>;
const Chart = () => <svg {...I()}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>;
const Key = () => <svg {...I()}><circle cx="8" cy="8" r="4" /><path d="m11 11 8 8m-3-3 2-2m-4 0 2-2" /></svg>;
const Card = () => <svg {...I()}><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>;
const Van = () => <svg {...I()}><path d="M2 5h11v11H2z" /><path d="M13 9h4l4 3.5V16h-8" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>;
const Bug = () => <svg {...I()}><path d="m5 16 5-5-5-5" /><path d="M12 19h8" /></svg>;

/* ──────────────────────────────────────────
   Setup
   ────────────────────────────────────────── */
const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const STORE_KEY = "frontdesk.v2";
const GATE = 0.25; // mirrors CONFIDENCE_THRESHOLD in backend/app/config.py
const AGENT = "Maya"; // mirrors AGENT_NAME

const FALLBACK_LANGUAGES = [
  { code: "auto", name: "Match my message" },
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "ml", name: "Malayalam" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "kn", name: "Kannada" },
  { code: "bn", name: "Bengali" },
  { code: "mr", name: "Marathi" },
  { code: "gu", name: "Gujarati" },
  { code: "pa", name: "Punjabi" },
  { code: "ur", name: "Urdu" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "ar", name: "Arabic" },
];

const TOPICS = [
  { id: "account", icon: <Key />, name: "Signing in", desc: "Passwords, locked accounts, and login errors.",
    issues: ["I can't log in to my account", "My account is locked after failed attempts"] },
  { id: "billing", icon: <Card />, name: "Payments", desc: "Charges that failed, repeated, or never refunded.",
    issues: ["My payment was charged twice", "Payment failed but the money left my account"] },
  { id: "orders", icon: <Van />, name: "Orders", desc: "Where a parcel is, and what to do when it's late.",
    issues: ["My order hasn't arrived yet", "I want a refund for my order"] },
  { id: "tech", icon: <Bug />, name: "Something broke", desc: "Errors, crashes, and pages that won't load.",
    issues: ["I'm getting a 500 error on the website", "The site crashed during checkout"] },
];

const FALLBACK_KB = [
  { id: "kb-001", category: "login_issue", title: "Cannot log in — invalid credentials", content: "Check the email and password, turn off Caps Lock, and try a private browser window to rule out cached data." },
  { id: "kb-003", category: "payment_failed", title: "Duplicate charge on a card", content: "A duplicate pending charge is usually an authorisation hold. It drops off the statement within three to five business days." },
  { id: "kb-005", category: "refund_request", title: "Requesting a refund", content: "Refunds can be requested within 30 days of purchase on eligible products, and land back on the original payment method." },
  { id: "kb-006", category: "order_delay", title: "Delivery delayed by the courier", content: "Tracking syncs every 24 hours as a parcel moves between regional hubs, so a quiet day is normal mid-route." },
  { id: "kb-007", category: "technical_error", title: "500 internal server error", content: "Refresh, then try a private window. Server outages are picked up automatically and fixed by the engineering team." },
];

// A person doesn't say the same thing every time they're thinking.
const WAITING = [
  "Reading through the help articles",
  "Checking what we've got on this",
  "Looking that up now",
  "One moment — pulling up the details",
];

const load = () => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { chats: [], name: "", lang: "auto" }; }
  catch { return { chats: [], name: "", lang: "auto" }; }
};
const persist = (s) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch { /* private mode */ } };

const clock = (iso) => new Date(iso || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const newId = () => `c${Date.now().toString(36)}`;
const pct = (n) => Math.round((n || 0) * 100);

/* ══════════════════════════════════════════
   INTAKE
   ══════════════════════════════════════════ */
function Intake({ name, onAsk, onOpenKB }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return TOPICS;
    return TOPICS
      .map((c) => ({ ...c, issues: c.issues.filter((i) => i.toLowerCase().includes(t)),
                     hit: (c.name + c.desc).toLowerCase().includes(t) }))
      .filter((c) => c.issues.length || c.hit);
  }, [q]);

  return (
    <div className="intake">
      <div className="intake-inner">
        <h1 className="intake-ask">{name ? `What's up, ${name}?` : "What's gone wrong?"}</h1>
        <p className="intake-note">
          Tell me in your own words. I'll give you the actual fix, straight from our help
          articles — and if I'm not sure, I'll say so and get you a person instead of guessing.
        </p>

        <div className="intake-find">
          <Find />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search — refund, locked out, late delivery…" aria-label="Search help topics" />
          {q && <button className="find-clear" onClick={() => setQ("")} aria-label="Clear"><Close /></button>}
        </div>

        <div className="topics">
          {shown.length === 0 ? (
            <p className="intake-empty">
              Nothing filed under “{q}”. Type the whole problem into the box at the bottom
              instead — I read plain sentences, not keywords.
            </p>
          ) : shown.map((c) => (
            <section className="topic" key={c.id}>
              <div>
                <div className="topic-icon">{c.icon}</div>
                <h2 className="topic-name">{c.name}</h2>
                <p className="topic-desc">{c.desc}</p>
              </div>
              <div className="topic-links">
                {(c.issues.length ? c.issues : TOPICS.find((t) => t.id === c.id).issues).map((i) => (
                  <button key={i} className="topic-link" onClick={() => onAsk(i)}>{i}</button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="intake-empty" style={{ marginTop: 0 }}>
          Rather read first? <button className="text-link" onClick={onOpenKB}>Open the help articles</button>
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ESCALATION
   ══════════════════════════════════════════ */
function HandOff({ chat, meta, onDone }) {
  const [email, setEmail] = useState("");
  const [urgent, setUrgent] = useState(meta?.mood === "urgent");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("That email address doesn't look right.");
    setError(""); setSending(true);
    try {
      const r = await fetch(`${API}/escalate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_name: chat.who,
          email,
          incident_text: meta?.incident_text || chat.turns.find((t) => t.role === "you")?.text || "",
          predicted_intent: meta?.predicted_intent || "",
          priority: urgent ? "urgent" : "normal",
          conversation_id: chat.id,
        }),
      });
      if (!r.ok) throw new Error();
      onDone(await r.json());
    } catch {
      setError("Couldn't reach the desk. Try again in a moment.");
    } finally { setSending(false); }
  };

  return (
    <div className="handoff">
      <h3>Get a person on this</h3>
      <p>Leave an email address and a colleague picks it up, with everything you've said so far attached.</p>
      <div className="handoff-row">
        <input type="email" value={email} placeholder="you@example.com" autoComplete="email"
          onChange={(e) => { setEmail(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && submit()} aria-label="Your email address" />
        <button className="handoff-go" onClick={submit} disabled={sending}>
          {sending ? "Sending…" : "Hand it over"}
        </button>
      </div>
      <label className="handoff-check">
        <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} />
        This is time-sensitive — reply within 4 hours instead of 24
      </label>
      {error && <p className="handoff-error">{error}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════
   INSPECTOR
   ══════════════════════════════════════════ */
const REASON = {
  low_confidence: "I couldn't tell for certain what this was about.",
  no_matching_article: "Nothing in the help articles covers this.",
  wording_mismatch: "The wording didn't line up with what I'd expect for this kind of issue.",
};

function Inspector({ data, onClose }) {
  const conf = pct(data.confidence);
  const out = data.status !== "resolved";
  const arts = data.retrieved_articles || [];

  return (
    <aside className="inspector" aria-label="How this answer was produced">
      <div className="insp-head">
        <h2 className="insp-title">Why this answer</h2>
        <button className="drawer-close" onClick={onClose} aria-label="Close panel"><Close /></button>
      </div>
      <p className="insp-lede">
        {out ? (REASON[data.escalation_reason] || "This one needed a person.")
             : "Every step I took, and the articles I leaned on."}
        {data.language && data.language !== "English" ? ` Replied in ${data.language}.` : ""}
      </p>

      <div className="insp-block">
        <div className="trace">
          <div className="trace-step">
            <div className="trace-name">Read the message</div>
            <div className="trace-detail">
              Filed as {(data.predicted_intent || "unknown").replace(/_/g, " ")}
              {data.mood && data.mood !== "calm" ? ` · sounded ${data.mood}` : ""}
            </div>
          </div>
          <div className={`trace-step ${data.escalation_reason === "no_matching_article" ? "is-halt" : ""}`}>
            <div className="trace-name">Searched the help articles</div>
            <div className="trace-detail">{arts.length} close matches out of 25</div>
          </div>
          <div className={`trace-step ${out ? "is-halt" : ""}`}>
            <div className="trace-name">Checked I was sure enough</div>
            <div className="trace-detail">
              {out ? `${conf}% — under the ${pct(GATE)}% cut-off` : `${conf}% sure, and the wording backs it up`}
            </div>
          </div>
          <div className={`trace-step ${out ? "is-halt" : ""}`}>
            <div className="trace-name">{out ? "Handed it to a colleague" : "Wrote the reply"}</div>
            <div className="trace-detail">{out ? "Rather than guess" : "Only using the articles below"}</div>
          </div>
        </div>
      </div>

      <div className="insp-block">
        <div className="insp-label">Confidence</div>
        <div className="meter">
          <div className={`meter-fill ${out ? "is-low" : ""}`} style={{ width: `${Math.max(conf, 2)}%` }} />
          <div className="meter-gate" style={{ left: `${pct(GATE)}%` }} />
        </div>
        <div className="meter-legend"><span><b>{conf}%</b> sure</span><span>cut-off {pct(GATE)}%</span></div>
      </div>

      {arts.length > 0 && (
        <div className="insp-block">
          <div className="insp-label">Articles I read</div>
          {arts.map((a, i) => (
            <div className="source" key={i}>
              <div className="source-top">
                <span className="source-title">{a.title}</span>
                <span className="source-pct">{pct(a.similarity)}%</span>
              </div>
              <div className="source-bar"><i style={{ width: `${pct(a.similarity)}%` }} /></div>
            </div>
          ))}
        </div>
      )}

      <p className="insp-foot">
        I can only use wording from these articles. If none of them fit, I hand it over rather
        than invent an answer.
      </p>
    </aside>
  );
}

/* ══════════════════════════════════════════
   OPS
   ══════════════════════════════════════════ */
function Ops({ onClose }) {
  const [s, setS] = useState(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    fetch(`${API}/stats`).then((r) => r.json()).then(setS).catch(() => setErr(true));
  }, []);

  if (err) return <div className="ops"><div className="ops-inner"><p className="ops-blank">Couldn't load the numbers — the desk isn't answering.</p></div></div>;
  if (!s) return <div className="ops"><div className="ops-inner"><p className="ops-blank">Loading…</p></div></div>;

  const max = Math.max(1, ...s.by_intent.map((i) => i.count));

  return (
    <div className="ops">
      <div className="ops-inner">
        <div className="ops-head">
          <h1>How the desk is doing</h1>
          <button className="bar-btn" onClick={onClose}><Close /> Back to chat</button>
        </div>

        {s.total === 0 ? (
          <p className="ops-blank">Nothing logged yet. Answer a few questions and the numbers show up here.</p>
        ) : (
          <>
            <div className="figures">
              <div className="figure">
                <b>{pct(s.resolution_rate)}<span>%</span></b>
                <span className="figure-label">answered without a person</span>
              </div>
              <div className="figure">
                <b>{s.total}</b>
                <span className="figure-label">questions handled</span>
              </div>
              <div className="figure">
                <b>{pct(s.avg_confidence)}<span>%</span></b>
                <span className="figure-label">average confidence</span>
              </div>
              <div className="figure">
                <b>{s.feedback_count ? pct(s.helpful_rate) : "—"}{s.feedback_count ? <span>%</span> : null}</b>
                <span className="figure-label">
                  {s.feedback_count ? `said it helped, from ${s.feedback_count} votes` : "no votes yet"}
                </span>
              </div>
            </div>

            <section className="ops-block">
              <h2>What people ask about</h2>
              <div className="bars">
                {s.by_intent.map((i) => (
                  <div className="bar-row" key={i.intent}>
                    <span className="bar-name">{i.intent.replace(/_/g, " ")}</span>
                    <div className="bar-track">
                      <i style={{ width: `${(i.count / max) * 100}%` }} />
                      <em style={{ width: `${(i.resolved / max) * 100}%` }} />
                    </div>
                    <span className="bar-num">{i.resolved}/{i.count}</span>
                  </div>
                ))}
              </div>
              <p className="ops-note">The solid bar is what got answered on the spot; the rest went to a person.</p>
            </section>

            {s.needs_an_article.length > 0 && (
              <section className="ops-block">
                <h2>Where the help articles fall short</h2>
                <p className="ops-note" style={{ marginTop: 0, marginBottom: 14 }}>
                  These came in under 45% confidence. Each one is an article waiting to be written.
                </p>
                <div className="gaps">
                  {s.needs_an_article.map((g, i) => (
                    <div className="gap" key={i}>
                      <span className="gap-conf">{pct(g.confidence)}%</span>
                      <span className="gap-text">{g.incident_text}</span>
                      <span className="gap-state">{g.status === "resolved" ? "answered" : "handed over"}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <p className="ops-note">
              {s.open_tickets} ticket{s.open_tickets === 1 ? "" : "s"} waiting on an agent.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   KNOWLEDGE DRAWER
   ══════════════════════════════════════════ */
function KnowledgeDrawer({ onClose, onAsk }) {
  const [items, setItems] = useState(FALLBACK_KB);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(`${API}/knowledge`).then((r) => r.json())
      .then((d) => { if (alive && Array.isArray(d) && d.length) setItems(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const shown = items.filter((a) =>
    `${a.title} ${a.content} ${a.category || ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Help articles">
        <div className="drawer-head">
          <h2>Help articles</h2>
          <span className="count">{shown.length} of {items.length}</span>
          <button className="drawer-close" onClick={onClose} aria-label="Close"><Close /></button>
        </div>
        <div className="drawer-find">
          <Find />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter articles" autoFocus />
        </div>
        <div className="drawer-list">
          {shown.length === 0 ? <p className="drawer-blank">No article mentions “{q}”.</p> :
            shown.map((a) => (
              <article className="kb-item" key={a.id}>
                <h3>{a.title}</h3>
                <p>{a.content}</p>
                <button className="kb-ask" onClick={() => { onAsk(a.title); onClose(); }}>Ask me about this</button>
              </article>
            ))}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════
   APP
   ══════════════════════════════════════════ */
export default function App() {
  const boot = useRef(load()).current;

  const [chats, setChats] = useState(boot.chats);
  const [name, setName] = useState(boot.name);
  const [lang, setLang] = useState(boot.lang || "auto");
  const [languages, setLanguages] = useState(FALLBACK_LANGUAGES);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [waitLine, setWaitLine] = useState(WAITING[0]);
  const [copied, setCopied] = useState(null);
  const [speaking, setSpeaking] = useState(null);
  const [rated, setRated] = useState({});
  const [showKB, setShowKB] = useState(false);
  const [showWhy, setShowWhy] = useState(true);
  const [showOps, setShowOps] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [health, setHealth] = useState({ ok: true, llm_connected: true });

  const endRef = useRef(null);
  const boxRef = useRef(null);

  const chat = chats.find((c) => c.id === activeId) || null;
  const lastMeta = chat?.turns.filter((t) => t.meta).slice(-1)[0]?.meta || null;
  const turnCount = chat?.turns.length ?? 0;
  const tailText = chat?.turns[turnCount - 1]?.text ?? "";

  useEffect(() => { persist({ chats, name, lang }); }, [chats, name, lang]);

  useEffect(() => {
    fetch(`${API}/languages`).then((r) => r.json())
      .then((d) => { if (Array.isArray(d) && d.length) setLanguages(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turnCount, tailText, busy]);

  useEffect(() => {
    const ping = () => fetch(`${API}/`).then((r) => r.json())
      .then((d) => setHealth({ ok: true, ...d }))
      .catch(() => setHealth({ ok: false }));
    ping();
    const t = setInterval(ping, 30000);
    return () => clearInterval(t);
  }, []);

  const patch = useCallback((id, fn) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, ...fn(c) } : c)));
  }, []);

  /* ── Ask, streaming where possible ── */
  const ask = useCallback(async (id, text, who, history) => {
    setBusy(true);
    setWaitLine(WAITING[Math.floor(Math.random() * WAITING.length)]);

    // Placeholder turn that fills in as chunks arrive.
    patch(id, (c) => ({
      turns: [...c.turns, { role: "agent", text: "", streaming: true, at: new Date().toISOString() }],
    }));
    const put = (fn) => patch(id, (c) => {
      const turns = [...c.turns];
      turns[turns.length - 1] = fn(turns[turns.length - 1]);
      return { turns };
    });

    const body = JSON.stringify({
      incident_text: text, user_name: who || "Customer", conversation_id: id, history,
      preferred_language: lang,
    });

    try {
      const r = await fetch(`${API}/resolve/stream`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body,
      });
      if (!r.ok || !r.body) throw new Error("no stream");

      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });

        let cut;
        while ((cut = buf.indexOf("\n\n")) !== -1) {
          const frame = buf.slice(0, cut);
          buf = buf.slice(cut + 2);
          const kind = frame.match(/^event: (.+)$/m)?.[1];
          const raw = frame.match(/^data: ([\s\S]*)$/m)?.[1];
          if (!kind || raw === undefined) continue;

          let payload;
          try { payload = JSON.parse(raw); } catch { continue; }

          if (kind === "meta") {
            setBusy(false);
            patch(id, () => ({ status: payload.status }));
            put((t) => ({ ...t, meta: { ...payload, incident_text: text, user_name: who } }));
            setShowWhy(true);
          } else if (kind === "token") {
            put((t) => ({ ...t, text: t.text + payload }));
          } else if (kind === "done") {
            // The requested language may not be what actually came back
            // (e.g. it falls back to English when Gemini isn't reachable),
            // so "language" only arrives now, once generation is done.
            put((t) => ({
              ...t,
              text: payload.response || t.text,
              streaming: false,
              meta: t.meta ? { ...t.meta, language: payload.language } : t.meta,
            }));
          }
        }
      }
      put((t) => ({ ...t, streaming: false }));
    } catch {
      // Streaming unavailable — fall back to the plain endpoint.
      try {
        const r = await fetch(`${API}/resolve`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body,
        });
        if (!r.ok) throw new Error();
        const d = await r.json();
        patch(id, () => ({ status: d.status }));
        put(() => ({ role: "agent", text: d.response, meta: d, at: new Date().toISOString() }));
        setShowWhy(true);
      } catch {
        put(() => ({ role: "agent", failed: true, retry: text, at: new Date().toISOString() }));
      }
    } finally {
      setBusy(false);
    }
  }, [patch, lang]);

  const historyOf = (c) => c.turns
    .filter((t) => t.text && !t.failed)
    .map((t) => ({ role: t.role === "you" ? "customer" : "agent", text: t.text }));

  const startChat = useCallback((first) => {
    const id = newId();
    const who = name || "Customer";
    const title = first ? (first.length > 34 ? first.slice(0, 34) + "…" : first) : "New chat";
    setChats((p) => [{
      id, title, status: "open", who,
      turns: first ? [{ role: "you", text: first, at: new Date().toISOString() }] : [],
      at: new Date().toISOString(),
    }, ...p]);
    setActiveId(id); setRailOpen(false); setShowOps(false); setDraft("");
    if (first) ask(id, first, who, []);
    else setTimeout(() => boxRef.current?.focus(), 60);
  }, [name, ask]);

  const send = (override) => {
    const text = (override ?? draft).trim();
    if (!text || busy) return;
    if (override === undefined) setDraft("");
    if (!chat) return startChat(text);
    const history = historyOf(chat);
    patch(chat.id, (c) => ({
      title: c.turns.length === 0 ? (text.length > 34 ? text.slice(0, 34) + "…" : text) : c.title,
      turns: [...c.turns, { role: "you", text, at: new Date().toISOString() }],
    }));
    ask(chat.id, text, chat.who, history);
  };

  const rate = (key, helpful, meta) => {
    setRated((r) => ({ ...r, [key]: helpful ? "yes" : "no" }));
    fetch(`${API}/feedback`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        helpful, conversation_id: chat?.id, incident_text: meta?.incident_text,
        predicted_intent: meta?.predicted_intent, confidence: meta?.confidence,
      }),
    }).catch(() => {});
  };

  const speak = (text, key) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (speaking === key) return setSpeaking(null);
    const u = new SpeechSynthesisUtterance(text);
    u.onend = () => setSpeaking(null);
    setSpeaking(key);
    window.speechSynthesis.speak(u);
  };

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const exportChat = () => {
    if (!chat) return;
    const lines = [
      `# Support chat — ${chat.title}`,
      `${chat.who} · ${new Date(chat.at).toLocaleString()}`,
      `Outcome: ${chat.status === "resolved" ? "Answered" : chat.status === "escalated" ? "With a person" : "Open"}`,
      chat.ticket ? `Ticket: ${chat.ticket}` : "",
      "",
      ...chat.turns.filter((t) => !t.failed && t.text).map((t) =>
        `**${t.role === "agent" ? AGENT : chat.who}** (${clock(t.at)})\n\n${t.text}\n`),
    ].filter(Boolean);
    const src = lastMeta?.retrieved_articles;
    if (src?.length) {
      lines.push("---", "Articles used:", ...src.map((a) => `- ${a.title} (${pct(a.similarity)}% match)`));
    }
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url; a.download = `support-${chat.id}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const verdict = chat?.status === "resolved" ? "Answered"
    : chat?.status === "escalated" ? "With a person" : null;

  return (
    <div className="desk">
      {showKB && <KnowledgeDrawer onClose={() => setShowKB(false)} onAsk={startChat} />}

      <nav className={`rail ${railOpen ? "is-open" : ""}`} aria-label="Your chats">
        <div className="rail-mark"><b>Front Desk</b><span>support</span></div>

        <button className="rail-new" onClick={() => startChat()}><Plus /> Start a new chat</button>
        <button className="rail-kb" onClick={() => setShowKB(true)}><Book /> Read the help articles</button>
        <button className="rail-kb" onClick={() => { setShowOps(true); setRailOpen(false); }}>
          <Chart /> How the desk is doing
        </button>

        <div className="rail-heading">Your chats</div>
        <div className="rail-list">
          {chats.length === 0 ? (
            <p className="rail-blank">Nothing here yet. Your chats stay on this device.</p>
          ) : chats.map((c) => (
            <button key={c.id}
              className={`rail-item s-${c.status} ${c.id === activeId && !showOps ? "is-active" : ""}`}
              onClick={() => { setActiveId(c.id); setShowOps(false); setRailOpen(false); }}>
              <span className="rail-item-title">{c.title}</span>
              <span className="rail-item-sub">
                {c.status === "resolved" ? "Answered"
                  : c.status === "escalated" ? (c.ticket || "With a person") : "Open"} · {clock(c.at)}
              </span>
            </button>
          ))}
        </div>

        <div className="rail-you">
          <label className="sr" htmlFor="who">Your name</label>
          <input id="who" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Add your name" maxLength={40} />
        </div>

        <div className="rail-lang">
          <label className="sr" htmlFor="lang">Reply language</label>
          <select id="lang" value={lang} onChange={(e) => setLang(e.target.value)}>
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>

        <div className="rail-status">
          <span className={`pulse ${health.ok ? "" : "is-down"}`} />
          {!health.ok ? "Can't reach the desk"
            : health.llm_connected === false ? "Answering from articles only"
            : `${AGENT} is on the desk`}
        </div>
      </nav>

      <main className="desk-main">
        <header className="desk-bar">
          <button className="rail-toggle" onClick={() => setRailOpen((v) => !v)} aria-label="Show chats"><Menu /></button>
          <span className="bar-title">{showOps ? "How the desk is doing" : chat ? chat.title : "Front Desk"}</span>
          {!showOps && verdict && <span className={`bar-verdict v-${chat.status}`}>{chat.ticket || verdict}</span>}
          <div className="bar-actions">
            {!showOps && lastMeta && (
              <button className={`bar-btn ${showWhy ? "is-on" : ""}`} onClick={() => setShowWhy((v) => !v)}>
                <Why /> Why this answer
              </button>
            )}
            {!showOps && chat?.turns.length > 0 && (
              <button className="bar-btn" onClick={exportChat}><Save /> Save</button>
            )}
          </div>
        </header>

        {showOps ? <Ops onClose={() => setShowOps(false)} />
          : !chat ? <Intake name={name} onAsk={startChat} onOpenKB={() => setShowKB(true)} />
          : (
          <div className="thread">
            <div className="thread-scroll" aria-live="polite">
              {chat.turns.map((t, i) => {
                const key = `${chat.id}-${i}`;
                const last = i === chat.turns.length - 1;

                if (t.role === "you") return (
                  <div className="turn is-you" key={key}>
                    <div className="turn-inner">
                      <div className="turn-who">{chat.who}</div>
                      <div className="turn-body">{t.text}</div>
                    </div>
                  </div>
                );

                if (t.failed) return (
                  <div className="turn is-agent" key={key}>
                    <div className="turn-error">
                      I can't reach the support service. Check the backend is running on {API}.
                      <button onClick={() => ask(chat.id, t.retry, chat.who, historyOf(chat))}>Try again</button>
                    </div>
                  </div>
                );

                return (
                  <div className="turn is-agent" key={key}>
                    <div className="turn-who">
                      {AGENT} · {clock(t.at)}
                      {!t.streaming && t.meta?.language && t.meta.language !== "English"
                        ? ` · Replied in ${t.meta.language}` : ""}
                    </div>
                    <div className="turn-body">
                      {t.text}
                      {t.streaming && <span className="caret" />}
                    </div>

                    {!t.streaming && t.text && (
                      <div className="turn-tools">
                        <button className="tool-btn" onClick={() => copy(t.text, key)}>
                          {copied === key ? <Tick /> : <Copy />} {copied === key ? "Copied" : "Copy"}
                        </button>
                        <button className={`tool-btn ${speaking === key ? "is-on" : ""}`}
                          onClick={() => speak(t.text, key)}>
                          <Speak /> {speaking === key ? "Stop" : "Read aloud"}
                        </button>
                      </div>
                    )}

                    {!t.streaming && last && t.meta?.suggested_replies?.length > 0 && !chat.ticket && (
                      <div className="chips">
                        {t.meta.suggested_replies.map((s) => (
                          <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
                        ))}
                      </div>
                    )}

                    {!t.streaming && t.meta && (
                      <div className="turn-rate">
                        {rated[key] ? (
                          <span className="rate-done">
                            {rated[key] === "yes" ? "Good — glad that landed." : "Noted. I've flagged that answer."}
                          </span>
                        ) : (
                          <>
                            <span className="rate-q">Did that sort it?</span>
                            <button className="rate-btn" onClick={() => rate(key, true, t.meta)}>Yes</button>
                            <button className="rate-btn" onClick={() => rate(key, false, t.meta)}>Not really</button>
                          </>
                        )}
                      </div>
                    )}

                    {!t.streaming && last && t.meta &&
                      (t.meta.status === "escalated" || rated[key] === "no") && (
                        chat.ticket ? (
                          <div className="handoff is-done">
                            <h3>{chat.ticket} is with a colleague</h3>
                            <p>{chat.ticketNote}</p>
                          </div>
                        ) : (
                          <HandOff chat={chat} meta={t.meta}
                            onDone={(d) => patch(chat.id, () => ({
                              status: "escalated", ticket: d.ticket_ref, ticketNote: d.message,
                            }))} />
                        )
                      )}
                  </div>
                );
              })}

              {busy && (
                <div className="turn is-agent">
                  <div className="turn-who">{AGENT}</div>
                  <div className="thinking"><i /><i /><i /><span>{waitLine}</span></div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="composer">
              <div className="composer-inner">
                <label className="sr" htmlFor="msg">Your message</label>
                <textarea id="msg" ref={boxRef} rows={1} value={draft}
                  placeholder={chat.turns.length ? "Ask a follow-up" : "Describe what happened"}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                  }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
                <button className="composer-send" onClick={() => send()} disabled={!draft.trim() || busy} aria-label="Send">
                  <Send />
                </button>
              </div>
              <p className="composer-hint">Enter sends · Shift + Enter starts a new line</p>
            </div>
          </div>
        )}
      </main>

      {!showOps && chat && lastMeta && showWhy && (
        <Inspector data={lastMeta} onClose={() => setShowWhy(false)} />
      )}
    </div>
  );
}