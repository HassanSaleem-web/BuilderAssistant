import React, { useEffect, useRef, useState } from "react";
import "./ChatBox.css";
import TypewriterBubble from "./TypewriterBubble";
import AnimatedTyping from "./AnimatedTyping";
import { useAuth } from "./auth/AuthContext.jsx";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import { FiCreditCard, FiLogOut, FiChevronRight } from "react-icons/fi";
import { useLanguage } from "./context/LanguageContext.jsx";


// i18n ---------------------------------------------------------------------------------
const I18N = {
  EN: {
    // Roles (labels only; values stay stable keys)
    role_investor: "Investor",
    role_designer: "Designer",
    role_site_manager: "Site Manager",
    role_contractor: "Contractor",
    role_tradesman: "Tradesman",



    // Placeholders per role
    ph_investor: "Check if my documentation meets Czech standards.",
    ph_designer: "Validate BEP structure and missing sections.",
    ph_site_manager: "Review safety and inspection checklist.",
    ph_contractor: "Generate delivery checklist for the client.",
    ph_tradesman: "Check my work contract and highlight missing or risky clauses.",
    // Header / controls
    dark: "🌙 Dark",
    light: "☀️ Light",

    // Panels
    documents: "Documents",
    add_document: "+ Add Document",
    chat: "Chat",
    sending: "Sending...",
    results: "Results",
    no_results: "No results yet. Ask the bot to analyze a document.",

    // Export
    export_txt: "Export TXT",
    export_docx: "Export DOCX",
    generating_txt: "Generating TXT...",
    generating_docx: "Generating DOCX...",

    // Profile / menu
    buy_subscription: "Buy Subscription",
    logout: "Logout",

    // Credits bubble
    credits_remaining_singular: "free credit remaining",
    credits_remaining_plural: "free credits remaining",

    // Modals
    warn_title: "Wait! You still have credits left",
    warn_body_a: "You currently have ",
    warn_body_b_one: " remaining credit. Buying a new plan now will ",
    warn_body_b_many: " remaining credits. Buying a new plan now will ",
    warn_body_c: "reset",
    warn_body_d: " your credits to the plan amount — they won’t be added.",
    continue_anyway: "Continue Anyway",
    cancel: "Cancel",

    no_credits_title: "Buy more credits to chat",
    no_credits_body: "You’ve used all your free credits. Please buy more credits to continue chatting and unlock new features.",
    go_to_subscription: "Go to Subscription",
  },

  CS: {
    // Roles
    role_investor: "Investor",
    role_designer: "Projektant",
    role_site_manager: "Stavbyvedoucí",
    role_contractor: "Dodavatel",
    role_tradesman: "Řemeslník",
    

    // Placeholders per role
    ph_investor: "Zkontrolujte, zda moje dokumentace splňuje české normy.",
    ph_designer: "Ověřte strukturu BEP a chybějící části.",
    ph_site_manager: "Zkontrolujte bezpečnost a inspekční seznam.",
    ph_contractor: "Vytvořte předávací checklist pro klienta.",
    ph_tradesman: "Zkontrolujte moji pracovní smlouvu a upozorněte na chybějící nebo rizikové části.",
    

    // Header / controls
    dark: "🌙 Tmavý",
    light: "☀️ Světlý",

    // Panels
    documents: "Dokumenty",
    add_document: "+ Přidat dokument",
    chat: "Odeslat",
    sending: "Odesílám...",
    results: "Výsledky",
    no_results: "Zatím žádné výsledky. Požádejte bota o analýzu dokumentu.",

    // Export
    export_txt: "Export TXT",
    export_docx: "Export DOCX",
    generating_txt: "Generuji TXT...",
    generating_docx: "Generuji DOCX...",

    // Profile / menu
    buy_subscription: "Koupit předplatné",
    logout: "Odhlásit se",

    // Credits bubble
    credits_remaining_singular: "zbývající kredit zdarma",
    credits_remaining_plural: "zbývajících kreditů zdarma",

    // Modals
    warn_title: "Počkejte! Stále máte kredity",
    warn_body_a: "Aktuálně máte ",
    warn_body_b_one: " zbývající kredit. Nákup nového plánu nyní ",
    warn_body_b_many: " zbývajících kreditů. Nákup nového plánu nyní ",
    warn_body_c: "resetuje",
    warn_body_d: " vaše kredity na hodnotu plánu — nepřičte je.",

    continue_anyway: "Pokračovat",
    cancel: "Zrušit",

    no_credits_title: "Kupte další kredity pro chat",
    no_credits_body: "Vyčerpali jste všechny volné kredity. Kupte prosím další, abyste mohli pokračovat a odemknout nové funkce.",
    go_to_subscription: "Přejít na předplatné",
  },
};

// stable role keys used in state/backend
const ROLE_KEYS = ["investor", "designer", "site_manager", "contractor", "tradesman"];

// translator helper
const t = (lang, key) => (I18N[lang]?.[key] ?? I18N.EN[key] ?? key);



export default function ChatBox() {
  const [creditAnim, setCreditAnim] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const { user, setUser } = useAuth();
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedRole, setSelectedRole] = useState("investor");
  
const { selectedLanguage, setSelectedLanguage } = useLanguage();

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [exportLoading, setExportLoading] = useState({ txt: false, docx: false });
  const fileInputRef = useRef();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showBuyWarning, setShowBuyWarning] = useState(false);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [userDocs, setUserDocs] = useState([]);
  const [showTypingHint, setShowTypingHint] = useState(false);

// ---- Chat history API base ----
const AUTH_API = (import.meta.env.VITE_AUTH_API_URL || "").replace(/\/$/, "");
const CHAT_API = `${AUTH_API}/api/chat`;

  
  const handleBuySubscription = () => {
    const remaining = Number(user?.creditsLeft ?? 0);
    if (remaining > 0) {
      setShowBuyWarning(true);
    } else {
      navigate("/subscribe");
    }
  };

  /* ------------------------------
     Dynamic placeholders
  ------------------------------ */
  const getRolePlaceholder = (lang, roleKey) => {
    const map = {
      investor: "ph_investor",
      designer: "ph_designer",
      site_manager: "ph_site_manager",
      contractor: "ph_contractor",
      tradesman: "ph_tradesman",
    };
    return t(lang, map[roleKey]);
  };
  
  const [placeholderText, setPlaceholderText] = useState(getRolePlaceholder(selectedLanguage, selectedRole));
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  
  useEffect(() => {
    setPlaceholderText(getRolePlaceholder(selectedLanguage, selectedRole));
    setShowPlaceholder(true);
    const timer = setTimeout(() => setShowPlaceholder(false), 2500);
    return () => clearTimeout(timer);
  }, [selectedRole, selectedLanguage]);
  
  /* ------------------------------
     Theme control
  ------------------------------ */
  useEffect(() => {
    localStorage.setItem("language", selectedLanguage);
    document.documentElement.setAttribute("lang", selectedLanguage.toLowerCase());
  }, [selectedLanguage]);
  
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
// ⬇️ Hydrate chat on mount / when user becomes available
useEffect(() => {
  let aborted = false;
  if (!user?._id) return; // requires authenticated user (cookie-based)

  (async () => {
    try {
      const res = await fetch(`${CHAT_API}/last`, {
        method: "GET",
        credentials: "include", // IMPORTANT: send cookie for auth
      });
      if (!res.ok) {
        if (res.status === 401) {
          console.warn("Not authorized to fetch chat history");
        } else {
          console.warn("Chat history fetch failed:", res.status);
        }
        return;
      }
      const data = await res.json(); // { messages: [...], updatedAt }
      if (!aborted && Array.isArray(data?.messages)) {
        // ✅ Show backend messages instantly (no TypewriterBubble animation)
        setMessages(
          data.messages.map(m => ({
            role: m.role,
            content: m.content,
            fromBackend: true, // mark messages as preloaded
          }))
        );
      }
      
    } catch (e) {
      console.warn("Chat history fetch error:", e);
    }
  })();

  return () => { aborted = true; };
}, [user?._id, CHAT_API]);// for chat save

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));

  /* ------------------------------
     Text cleanup
  ------------------------------ */
  function cleanAssistantResponse(text) {
    if (!text) return "";
    return text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/【[^】]+】/g, "")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/^###\s+(.*)$/gm, "<h3>$1</h3>")
      .replace(/\n{2,}/g, "<br/><br/>")
      .replace(/\n/g, "<br/>")
      .trim();
  }
 // 🔁 Replace the whole function with this
 const deductCreditsFromBackend = async (amount = 1) => {
  // Normalize amount
  const amt = Math.max(1, Math.floor(amount));

  // Snapshot values before any async work to avoid stale-closure issues
  const AUTH_API = (import.meta.env.VITE_AUTH_API_URL || "").replace(/\/$/, "");
  const uid = user?._id;

  if (!uid || !AUTH_API) {
    console.warn("Skipping credit deduction: missing user ID or AUTH_API");
    return;
  }

  // 1) Optimistic update so UI moves immediately
  setUser((prev) => {
    if (!prev) return prev;
    const current = typeof prev.creditsLeft === "number" ? prev.creditsLeft : 0;
    const nextCredits = Math.max(current - amt, 0);
    const optimistic = { ...prev, creditsLeft: nextCredits };
    try { localStorage.setItem("user", JSON.stringify(optimistic)); } catch {}
    return optimistic;
  });
  setCreditAnim(true);
  setTimeout(() => setCreditAnim(false), 600);

  // 2) Call backend to persist (server is authoritative)
  try {
    const res = await fetch(`${AUTH_API}/api/auth/deduct-credits`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "include", // keep cookies if your auth uses them
      body: JSON.stringify({ userId: uid, amount: amt }),
    });

    // Attempt to parse JSON even on non-2xx for better diagnostics
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }

    if (res.ok && data && typeof data.creditsLeft === "number") {
      // 3) Reconcile with server value
      setUser((prev) => {
        if (!prev) return prev;
        const corrected = { ...prev, creditsLeft: data.creditsLeft };
        try { localStorage.setItem("user", JSON.stringify(corrected)); } catch {}
        return corrected;
      });
    } else {
      // 4) Roll back the optimistic update if server rejected it
      setUser((prev) => {
        if (!prev) return prev;
        const current = typeof prev.creditsLeft === "number" ? prev.creditsLeft : 0;
        const rolledBack = { ...prev, creditsLeft: current + amt };
        try { localStorage.setItem("user", JSON.stringify(rolledBack)); } catch {}
        return rolledBack;
      });
      console.warn("❌ Credit deduction failed:", data?.message || res.status);
    }
  } catch (err) {
    // 5) Network error → rollback optimistic update
    setUser((prev) => {
      if (!prev) return prev;
      const current = typeof prev.creditsLeft === "number" ? prev.creditsLeft : 0;
      const rolledBack = { ...prev, creditsLeft: current + amt };
      try { localStorage.setItem("user", JSON.stringify(rolledBack)); } catch {}
      return rolledBack;
    });
    console.error("⚠️ Error deducting credits:", err);
  }
};
// Save the latest user/assistant pair and refresh canonical last-10 from server
const saveChatPair = async (userText, assistantText) => {
  try {
    const res = await fetch(`${CHAT_API}/append`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // IMPORTANT
      body: JSON.stringify({
        userMessage: { role: "user", content: userText },
        assistantMessage: { role: "assistant", content: assistantText },
      }),
    });

    if (!res.ok) {
      console.warn("Failed to persist chat pair:", res.status);
      return;
    }

    const data = await res.json(); // { messages: [...], updatedAt }
    if (Array.isArray(data?.messages)) {
      // Replace local state with canonical trimmed last-10 from server
      setMessages(data.messages.map(m => ({
        role: m.role,
        content: m.content,
        fromBackend: true, // ✅ ensures past messages stay static
      })));
    }
    
  } catch (err) {
    console.warn("Persist chat error:", err);
  }
};//chat save function

   /* ------------------------------
     File handling
  ------------------------------ */
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files).filter((file) =>
      [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // ✅ .xlsx
        "application/vnd.ms-excel", // ✅ .xls (older Excel)
        "text/plain"
      ].includes(file.type)
    );
        setSelectedFiles((prev) => [...prev, ...files]);
  
    // 🔹 Immediately upload to backend (saves to Cloudinary + Mongo)
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
  
        const res = await fetch(`${import.meta.env.VITE_AUTH_API_URL}/api/documents`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
  
        if (!res.ok) {
          console.warn(`❌ Upload failed for ${file.name}`);
          continue;
        }
  
        const savedDoc = await res.json();
        console.log("✅ Saved document:", savedDoc);
      } catch (err) {
        console.error(`⚠️ Failed to save ${file.name}:`, err);
      }
    }
  };
 // 🔹 Fetch user's uploaded documents from backend
useEffect(() => {
  if (!user?._id) return;

  (async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_AUTH_API_URL}/api/documents`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) {
        console.warn("Failed to fetch documents:", res.status);
        return;
      }
      const docs = await res.json();
      setUserDocs(docs); // Array of document objects
      console.log("📄 User documents fetched:", docs);
    } catch (err) {
      console.error("Error fetching user documents:", err);
    }
  })();
}, [user?._id]);
 
  /* ------------------------------
     Send message → backend
  ------------------------------ */
  const sendMessage = async () => {
    if (!userInput.trim()) return;
    setLoading(true);
    if (Number(user?.creditsLeft ?? 0) <= 0) {
      setShowNoCreditsModal(true);
      return;
    }
    
    const userMessage = { role: "user", content: userInput };
    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "typing..." }]);
    setUserInput("");
  
    try {
      const formData = new FormData();
formData.append("message", userInput);
formData.append("role", selectedRole);
formData.append("language", selectedLanguage);
if (threadId) formData.append("threadId", threadId); // 👈 add this line
selectedFiles.forEach((f) => formData.append("files", f));

      const res = await fetch("https://builderbackend-2ndv.onrender.com/api/ask", {
        method: "POST",
        body: formData,
      });
  
      // --------------------------
      // 🧩 Handle Backend Failures
      // --------------------------
      if (!res.ok) {
        const replyMsg =
          res.status === 504
            ? "⚠️ The assistant took too long to respond. Please try again."
            : `❌ Server error (${res.status}).`;
  
            setMessages((prev) => {
              const updated = [...prev];
              const typingIndex = updated.findIndex((m) => m.content === "typing...");
              if (typingIndex !== -1)
                updated[typingIndex] = { role: "assistant", content: replyMsg };
              return updated;
            });
            
        // Deduct 1 credit even if the request fails
        await deductCreditsFromBackend();
        setLoading(false);
        return;
      }
  
      // --------------------------
      // ✅ Handle Successful Response
      // --------------------------
      const data = await res.json();
if (data.threadId && !threadId) setThreadId(data.threadId); // save thread for reuse

      const assistantReply = data.reply || "No response received.";
      const results = data.results || [];
  
      setMessages((prev) => {
        const updated = [...prev];
        const typingIndex = updated.findIndex((m) => m.content === "typing...");
        if (typingIndex !== -1)
          updated[typingIndex] = { role: "assistant", content: assistantReply };
        return updated;
      });
  
      setAnalysisResults(results);
      saveChatPair(userMessage.content, assistantReply);
  
      // ✅ Deduct credits on successful response
      await deductCreditsFromBackend();
    } catch (err) {
      console.error("Backend error:", err);
  
      setMessages((prev) => {
        const updated = [...prev];
        const typingIndex = updated.findIndex((m) => m.content === "typing...");
        if (typingIndex !== -1)
          updated[typingIndex] = {
            role: "assistant",
            content: "⚠️ Network error — could not reach backend.",
          };
        return updated;
      });
  
      // Deduct 1 credit even for network errors
      await deductCreditsFromBackend();
    }
  
    setLoading(false);
  };
  // Send on Enter (with IME safety and Shift+Enter reserved for newline if you switch to <textarea> later)
const handleKeyDown = (e) => {
  if (e.isComposing || e.keyCode === 229) return; // IME in progress
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    if (!loading && userInput.trim()) sendMessage();
  }
};

  /* ------------------------------
     Export summary (TXT / DOCX)
  ------------------------------ */
  const exportSummary = async (format = "txt") => {
    try {
      setExportLoading((p) => ({ ...p, [format]: true }));
      const res = await fetch("https://builderbackend-2ndv.onrender.com/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          analysisResults,
          role: selectedRole,
          language: selectedLanguage,
        }),
      });
  
      const data = await res.json();
      let summaryText = data.summary || "No summary available.";
  
      // 🔹 Markdown → formatted plain text
      summaryText = summaryText
        .replace(/\*\*(.+?)\*\*/g, (_, txt) => txt.toUpperCase()) // **bold**
        .replace(/\*(.+?)\*/g, (_, txt) => txt.toUpperCase())     // *italic*
        .replace(/^###\s*(.+)$/gm, (_, txt) => `\n=== ${txt.toUpperCase()} ===\n`) // ### heading
        .replace(/^##\s*(.+)$/gm, (_, txt) => `\n=== ${txt.toUpperCase()} ===\n`)  // ## heading
        .replace(/```[\s\S]*?```/g, "") // remove code blocks
        .replace(/<[^>]+>/g, "")        // remove HTML tags
        .trim();
  
      const title = "DigiStav | Validorix Report";
      const date = `Exported: ${new Date().toLocaleString()}`;
  
      const fullText =
        `${title}\n\n${date}\n\n------------------------------------------\n\n` +
        summaryText +
        "\n\nGenerated automatically by DigiStav | Validorix Assistant";
  
      const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
      saveAs(blob, `DigiStav_Validorix_Report.${format}`);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to generate export file.");
    } finally {
      setExportLoading((p) => ({ ...p, [format]: false }));
    }
  };
  
  /* ------------------------------
     UI Layout
  ------------------------------ */
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header-bar">
        <div className="brand-title">
          DigiStav <span className="sub-brand">| Validorix</span>
        </div>
        <div className="controls">
        <select
  className="role-selector"
  value={selectedRole}
  onChange={(e) => setSelectedRole(e.target.value)}
>
  <option value="investor">{t(selectedLanguage, "role_investor")}</option>
  <option value="designer">{t(selectedLanguage, "role_designer")}</option>
  <option value="site_manager">{t(selectedLanguage, "role_site_manager")}</option>
  <option value="contractor">{t(selectedLanguage, "role_contractor")}</option>
  <option value="tradesman">{t(selectedLanguage, "role_tradesman")}</option>

</select>

          <button className="theme-toggle-btn" onClick={toggleTheme}>
  {theme === "light" ? t(selectedLanguage, "dark") : t(selectedLanguage, "light")}
</button>

<div className="lang-switcher-toggle">
  <div
    className={`lang-toggle ${selectedLanguage === "CS" ? "cs" : "en"}`}
    onClick={() => setSelectedLanguage(selectedLanguage === "EN" ? "CS" : "EN")}
  >
    <div className="toggle-labels">
      <span>EN</span>
      <span>CS</span>
    </div>
    <div className="toggle-indicator" />
  </div>
</div>
         

          <div className="profile-dropdown">
            <div
              className="profile-circle"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              👤
            </div>
            {showProfileMenu && (
  <div className="profile-menu">
    <div className="profile-card">
      <div className="profile-header">
        <div className="avatar-icon">👤</div>
        <div className="profile-info">
          <h4>{user?.name || "User"}</h4>
          <p>{user?.email || "example@email.com"}</p>
        </div>
      </div>
      <div className="menu-divider" />
      <ul className="menu-list">
      <li onClick={handleBuySubscription} role="button" tabIndex={0}>
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <span className="icon"><FiCreditCard size={16} /></span>
    <span>{t(selectedLanguage, "buy_subscription")}</span>
  </div>
  <FiChevronRight size={16} style={{ color: "#9CA3AF" }} />
</li>

<li onClick={logout} role="button" tabIndex={0}>
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <span className="icon"><FiLogOut size={16} /></span>
    <span>{t(selectedLanguage, "logout")}</span>
  </div>
  <FiChevronRight size={16} style={{ color: "#9CA3AF" }} />
</li>
</ul>
    </div>
  </div>
)}
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="main-layout">
        {/* Documents */}
        <aside className="panel panel-docs">
        <div className="panel-title">{t(selectedLanguage, "documents")}</div>

        <input
  type="file"
  accept=".pdf,.docx,.txt,.xlsx,.xls"
  multiple
  ref={fileInputRef}
  onChange={handleFileChange}
  style={{ display: "none" }}
/>

<button className="btn-add" onClick={() => fileInputRef.current.click()}>
  {t(selectedLanguage, "add_document")}
</button>
  {/* --- Local new uploads --- */}
  {selectedFiles.length > 0 && (
    <div className="file-preview-container">
      {selectedFiles.map((file, index) => (
        <div key={index} className="file-preview-card">
          <span className="file-icon">📄</span>
          <div className="file-details">
            <div className="file-name">{file.name}</div>
            <div className="file-type">{file.type || "Unknown Type"}</div>
          </div>
          <button
            className="file-remove"
            onClick={() =>
              setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
            }
          >
            ✖
          </button>
        </div>
      ))}
    </div>
  )}

  {/* --- Existing documents from backend --- */}
  {userDocs.length > 0 && (
    <div className="file-preview-container">
      {userDocs.map((doc) => (
        <div key={doc._id} className="file-preview-card">
          <span className="file-icon">📄</span>
          <div className="file-details">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="file-name"
              style={{
                color: "inherit",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              {doc.originalName}
            </a>
            <div className="file-type">{doc.mimeType}</div>
          </div>
          <button
            className="file-remove"
            onClick={async () => {
              try {
                const res = await fetch(
                  `${import.meta.env.VITE_AUTH_API_URL}/api/documents/${doc._id}`,
                  {
                    method: "DELETE",
                    credentials: "include",
                  }
                );
                if (res.ok) {
                  setUserDocs((prev) => prev.filter((d) => d._id !== doc._id));
                } else {
                  alert("Failed to delete document.");
                }
              } catch (err) {
                console.error("Delete error:", err);
              }
            }}
          >
            ✖
          </button>
        </div>
      ))}
    </div>
  )}

  {/* --- No documents fallback --- */}
  {selectedFiles.length === 0 && userDocs.length === 0 && (
    <p style={{ fontSize: "14px", color: "#888", marginTop: "10px" }}>
      No uploaded documents yet.
    </p>
  )}
</aside>

        {/* Chat */}
        <section className="panel panel-chat">
          <div className="chat-log">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-bubble ${
                  msg.role === "user" ? "user-message" : "assistant-message"
                }`}
              >
                <div className="avatar">
                  {msg.role === "user" ? "🙍" : "🤖"}
                </div>
                <div className="bubble-content">
                {msg.content === "typing..." ? (
  <AnimatedTyping />
) : msg.role === "assistant" && !msg.fromBackend ? (
  <TypewriterBubble text={cleanAssistantResponse(msg.content)} />
) : (
  <span dangerouslySetInnerHTML={{ __html: cleanAssistantResponse(msg.content) }} />
)}


                </div>
              </div>
            ))}
          </div>
          {showTypingHint && (
  <div className="typing-hint-bubble">
    💡 For deeper checks, use words like “analyze” or “validate”.
  </div>
)}

          <div className="chat-input-row">
          <input
  type="text"
  className="chat-textbox"
  value={userInput}
  onChange={(e) => {
    setUserInput(e.target.value);
    setShowTypingHint(true);     // show the bubble when typing starts

    clearTimeout(window.typingHintTimer);
    window.typingHintTimer = setTimeout(() => {
      setShowTypingHint(false);  // auto-hide after 2 seconds of no typing
    }, 2000);
  }}
  onKeyDown={handleKeyDown}
  placeholder={showPlaceholder ? placeholderText : ""}
/>

           <button
  className="chat-send-btn"
  onClick={sendMessage}
  disabled={loading}
>
  {loading ? t(selectedLanguage, "sending") : t(selectedLanguage, "chat")}
</button>
          </div>
        </section>

        {/* Results */}
        <aside className="panel panel-results">
        <div className="panel-title">{t(selectedLanguage, "results")}</div>

<div className="results-scrollable">
  {analysisResults.length > 0 ? (
    <ul className="result-list">
      {analysisResults.map((item, idx) => {
        const icon =
          item.status === "success"
            ? "✔"
            : item.status === "warning"
            ? "⚠"
            : "✖";
        const iconColor =
          item.status === "success"
            ? "#10b981" // green
            : item.status === "warning"
            ? "#facc15" // yellow
            : "#ef4444"; // red
        return (
          <li key={idx} className="result-item">
            <span
              className="status-icon"
              style={{
                color: iconColor,
                fontWeight: 600,
                marginRight: "8px",
              }}
            >
              {icon}
            </span>
            <span className="result-text">{item.text}</span>
          </li>
        );
      })}
    </ul>
  ) : (
    <div className="results-empty">
      <p>{t(selectedLanguage, "no_results")}</p>
    </div>
  )}
</div>


          <div className="export-buttons">
          <button
  className="export-btn"
  onClick={() => exportSummary("txt")}
  disabled={exportLoading.txt}
>
  {exportLoading.txt ? t(selectedLanguage, "generating_txt") : t(selectedLanguage, "export_txt")}
</button>

<button
  className="export-btn"
  onClick={() => exportSummary("docx")}
  disabled={exportLoading.docx}
>
  {exportLoading.docx ? t(selectedLanguage, "generating_docx") : t(selectedLanguage, "export_docx")}
</button>
          </div>
        </aside>
        {user && (
  <div className={`credit-display ${creditAnim ? "credit-anim" : ""}`}>
    <div className="credit-dot" />
    <span>
      {Number(user.creditsLeft ?? 0)}{" "}
      {Number(user.creditsLeft) === 1
        ? t(selectedLanguage, "credits_remaining_singular")
        : t(selectedLanguage, "credits_remaining_plural")}
    </span>
  </div>
)}
{showBuyWarning && (
  <div
    className="modal-backdrop"
    onClick={(e) => {
      if (e.target === e.currentTarget) setShowBuyWarning(false);
    }}
    role="dialog"
    aria-modal="true"
  >
    <div className="modal-panel">
      <button
        className="modal-close"
        aria-label="Close"
        onClick={() => setShowBuyWarning(false)}
      >
        ×
      </button>

      <div className="modal-body">
        {/* Safe, constrained icon (inline SVG so it can’t blow up) */}
        <svg
  className="modal-icon"
  viewBox="0 0 24 24"
  fill="none"
  aria-hidden="true"
>
  <path
    d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
    stroke="#ef4444"
    strokeWidth="1.5"
    fill="#fee2e2"
  />
  <path d="M12 8v5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
  <circle cx="12" cy="17" r="1.25" fill="#ef4444" />
</svg>

<h2 className="modal-title">{t(selectedLanguage, "warn_title")}</h2>
<p className="modal-text">
  {t(selectedLanguage, "warn_body_a")}
  <strong>{Number(user?.creditsLeft ?? 0)}</strong>
  {Number(user?.creditsLeft ?? 0) === 1
    ? t(selectedLanguage, "warn_body_b_one")
    : t(selectedLanguage, "warn_body_b_many")}
  <strong> {t(selectedLanguage, "warn_body_c")} </strong>
  {t(selectedLanguage, "warn_body_d")}
</p>

<div className="modal-actions">
  <button className="btn btn-secondary" onClick={() => setShowBuyWarning(false)}>
    {t(selectedLanguage, "cancel")}
  </button>
  <button
    className="btn btn-primary"
    onClick={() => { setShowBuyWarning(false); navigate("/subscribe"); }}
  >
    {t(selectedLanguage, "continue_anyway")}
  </button>
</div>

      </div>
    </div>
  </div>
)}
{showNoCreditsModal && (
  <div
    className="modal-backdrop"
    onClick={(e) => {
      if (e.target === e.currentTarget) setShowNoCreditsModal(false);
    }}
    role="dialog"
    aria-modal="true"
  >
    <div className="modal-panel">
      <button
        className="modal-close"
        aria-label="Close"
        onClick={() => setShowNoCreditsModal(false)}
      >
        ×
      </button>

      <div className="modal-body">
        {/* Inline SVG icon */}
        <svg
  className="modal-icon"
  viewBox="0 0 24 24"
  fill="none"
  aria-hidden="true"
>
  <path
    d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
    stroke="#ef4444"
    strokeWidth="1.5"
    fill="#fee2e2"
  />
  <path d="M12 8v5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
  <circle cx="12" cy="17" r="1.25" fill="#ef4444" />
</svg>

<h2 className="modal-title text-[#1e3a8a]">{t(selectedLanguage, "no_credits_title")}</h2>
<p className="modal-text">{t(selectedLanguage, "no_credits_body")}</p>
<div className="modal-actions">
  <button
    className="btn btn-primary"
    onClick={() => { setShowNoCreditsModal(false); navigate("/subscribe"); }}
  >
    {t(selectedLanguage, "go_to_subscription")}
  </button>
</div>

      </div>
    </div>
  </div>
)}

      </div>
      

    </div>
    
  );
}