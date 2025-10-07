import React, { useEffect, useRef, useState } from "react";
import OpenAI from "openai";
import "./ChatBox.css";
import TypewriterBubble from "./TypewriterBubble";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";
import AnimatedTyping from "./AnimatedTyping";
import { Link } from "react-router-dom";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export default function ChatBox() {
  const [assistantId] = useState(import.meta.env.VITE_ASSISTANT_ID);
  const [threadId, setThreadId] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("Investor");
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const [analysisResults, setAnalysisResults] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
// Dynamic placeholder text per role
const rolePlaceholders = {
  Investor: "Check if my documentation meets Czech standards.",
  Designer: "Validate BEP structure and missing sections.",
  "Site Manager": "Review safety and inspection checklist.",
  Contractor: "Generate delivery checklist for the client.",
  Farmer: "Validate documents for grant applications."
};

const [placeholderText, setPlaceholderText] = useState(rolePlaceholders[selectedRole]);
const [showPlaceholder, setShowPlaceholder] = useState(true);

  const fileInputRef = useRef();
  const { logout } = useAuth();

  const roleInstructions = {
    Investor: `You are responding to an Investor. Keep your response high-level, non-technical, focused on compliance, documentation readiness, and project confidence. Avoid deep technical language.`,
    Designer: `You are responding to a Designer (Architect or Engineer). Your response should include detailed legal or technical references based on Czech norms and BEP validation rules.`,
    "Site Manager": `You are responding to a Site Manager. Use step-by-step, checklist-style validation. Avoid complexity. Prioritize readiness, safety, and version control.`,
    Contractor: `You are responding to a Contractor or Freelancer. Be clear and direct. Help with cost estimation, compliance for deliverables, and document handover preparation.`,
    Farmer: `You are responding to a Farmer involved in subsidy projects. Give clear, supportive steps focused on document validation and subsidy eligibility.`,
  };

  useEffect(() => {
    const createThread = async () => {
      const thread = await openai.beta.threads.create();
      setThreadId(thread.id);
    };
    createThread();
  }, []);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).filter((file) =>
      ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"].includes(file.type)
    );
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  function cleanAssistantResponse(text) {
    if (!text) return "";
  
    const cleaned = text
      // Remove “JSON Array with Key Results” section only, keeping content after it
      .replace(/JSON\s*Array\s*with\s*Key\s*Results[\s\S]*?```(?:json)?[\s\S]*?```/gi, "")
      // Clean leftover stray JSON arrays outside code fences
      .replace(/\[[\s\S]*?\]/g, "")
      // Remove dangling backticks and commas left behind
      .replace(/```/g, "")
      .replace(/,+\s*$/gm, "")
      // Remove OpenAI references
      .replace(/【[^】]+】/g, "")
      // Markdown: bold and headers
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/^###\s+(.*)$/gm, "<h3>$1</h3>")
      // Replace newlines with HTML line breaks
      .replace(/\n{2,}/g, "<br/><br/>")
      .replace(/\n/g, "<br/>")
      .trim();
  
    return cleaned;
  }    
  const sendMessage = async () => {
    if (!userInput.trim() || !threadId) return;
    setLoading(true);

    const userMessage = { role: "user", content: userInput };
    const placeholder = { role: "assistant", content: "typing..." };
    setMessages((prev) => [...prev, userMessage, placeholder]);
    setUserInput("");

    try {
      const uploadedFileIds = [];
      

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("purpose", "assistants");

        const res = await fetch("https://api.openai.com/v1/files", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          },
          body: formData,
        });

        const data = await res.json();
        if (data.id) uploadedFileIds.push(data.id);
      }

      const uploadedFileNames = selectedFiles.map((f) => f.name).join(", ") || "None";

      const contentToSend = `
      You are a helpful assistant.
      
      The user may upload documents (${uploadedFileNames}), but DO NOT reference, name, or analyze these documents **unless** they explicitly ask for it in their message.
      
      ⛔️ If the user does not request validation, analysis, review, or feedback — DO NOT mention the files. Just reply to the user’s question normally.
      
      ✅ If the user **does** ask to "validate", "analyze", or "review" a document, then:
      - DO perform the validation.
      - DO return your final response as a short summary **AND** a JSON array with key results.
      
      🟩 ALWAYS include this JSON array in your response when analysis is requested:
      [
        {"status": "success", "text": "What was validated successfully"},
        {"status": "error", "text": "What issues or missing elements were found"}
      ]
      
      Role Context: ${roleInstructions[selectedRole]}
      ${selectedLanguage === "CS" ? "Please respond in Czech." : ""}
      
      User Message:
      "${userInput}"
      `;
      


      const messagePayload = {
        role: "user",
        content: contentToSend,
        ...(uploadedFileIds.length > 0 && {
          attachments: uploadedFileIds.map((id) => ({
            file_id: id,
            tools: [{ type: "file_search" }],
          })),
        }),
      };

      await openai.beta.threads.messages.create(threadId, messagePayload);

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
      });

      let runStatus;
      do {
        await new Promise((r) => setTimeout(r, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(run.id, {
          thread_id: threadId,
        });
      } while (runStatus.status !== "completed");

      const response = await openai.beta.threads.messages.list(threadId);
      const latestAssistant = response.data.find((m) => m.role === "assistant");
      const assistantContent = latestAssistant?.content[0]?.text?.value || "";

      const resultRegex = /\[.*?\]/s;
      const match = assistantContent.match(resultRegex);
      let structuredResults = [];

      if (match) {
        try {
          structuredResults = JSON.parse(match[0]);
        } catch (err) {
          console.warn("Could not parse JSON result:", err);
        }
      }

      setAnalysisResults(structuredResults);
      setMessages((prev) => {
        const updated = [...prev];
        const typingIndex = updated.findIndex((m) => m.content === "typing...");
        if (typingIndex !== -1) {
          updated[typingIndex] = { role: "assistant", content: assistantContent };
        } else {
          updated.push({ role: "assistant", content: assistantContent });
        }
        return updated;
      });
    } catch (err) {
      console.error("Chat error:", err);
    }

    setLoading(false);
  };
  // --- PDF text utilities ---
const BRAND_BLUE = [37, 99, 235];

function stripValidationJson(source) {
  let txt = source || "";

  // remove “### JSON Array with Key Results” section only (keep what comes after)
  txt = txt.replace(/###\s*JSON\s*Array\s*with\s*Key\s*Results[\s\S]*?```(?:json)?[\s\S]*?```/gi, "");

  // remove any remaining fenced code blocks
  txt = txt.replace(/```[\s\S]*?```/g, "");

  // remove stray JSON arrays left outside code fences (defensive)
  txt = txt.replace(/^\s*\[[\s\S]*?\]\s*$/gm, "");

  // remove OpenAI-style footnote tags and leftover garbage bytes/entities
  txt = txt.replace(/【[^】]+】/g, "")
           .replace(/&[a-z0-9#]+;/gi, "")
           .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u024F]/g, "");

  // normalize newlines
  txt = txt.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return txt;
}

// Render a paragraph that may contain **bold** segments, with word-wrapping
function renderRichParagraph(doc, text, x, y, maxWidth, lineHeight, pageBottom, margin) {
  const segments = text.split(/\*\*(.+?)\*\*/g) // odd indexes are bold
                       .map((seg, i) => ({ text: seg, bold: i % 2 === 1 }))
                       .filter(s => s.text.length);

  let currX = x;
  let currY = y;

  const pushLine = (line, isBold) => {
    if (currY > pageBottom) {
      doc.addPage();
      currY = margin;
    }
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.text(line, currX, currY);
  };

  // break segments by words and wrap intelligently
  let line = "";
  let lineBoldMask = []; // parallel mask of which chars are bold; we’ll render per chunk
  const flush = () => {
    if (!line) return;
    // render a mixed-style line by slicing consecutive bold/plain chunks
    let idx = 0;
    while (idx < line.length) {
      const state = lineBoldMask[idx];
      let j = idx;
      while (j < line.length && lineBoldMask[j] === state) j++;
      const slice = line.slice(idx, j);
      doc.setFont("helvetica", state ? "bold" : "normal");
      doc.text(slice, currX, currY, { baseline: "top" });
      currX += doc.getTextWidth(slice + " ");
      idx = j;
    }
    currX = x;
    currY += lineHeight;
    line = "";
    lineBoldMask = [];
  };

  const spaceWidth = doc.getTextWidth(" ");
  const appendWord = (word, isBold) => {
    const wordWidth = doc.getTextWidth(word);
    const lineWidth = doc.getTextWidth(line);

    if (lineWidth + (line ? spaceWidth : 0) + wordWidth > maxWidth) {
      flush();
    }
    if (line) {
      line += " ";
      lineBoldMask.push(...Array(1).fill(false)); // space non-bold, visual spacing
    }
    line += word;
    lineBoldMask.push(...Array(word.length).fill(isBold));
  };

  // iterate words preserving bold state
  segments.forEach(seg => {
    const words = seg.text.split(/\s+/).filter(Boolean);
    words.forEach(w => appendWord(w, seg.bold));
  });
  flush();

  return currY;
}
// Consistent vertical rhythm for PDF
const SPACING = {
  paraLine: 16,          // baseline line height
  paraGap: 6,            // after normal paragraphs
  bulletGap: 4,          // after bullet paragraphs
  headingGapBefore: 12,  // space before each ### heading
  headingGapAfter: 20,     // space after each heading
};
function renderCenteredTitle(doc, text, y, pageWidth, color = [37, 99, 235]) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);              // title size
  doc.setTextColor(...color);
  doc.text(text, pageWidth / 2, y, { align: "center" });

  // optional thin underline (60% width, centered)
  const underlineWidth = pageWidth * 0.60;
  const startX = (pageWidth - underlineWidth) / 2;
  doc.setDrawColor(...color);
  doc.setLineWidth(0.75);
  doc.line(startX, y + 6, startX + underlineWidth, y + 6);

  // reset defaults for body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(33, 33, 33);

  return y + 18; // spacing after title
}

// Render a heading line (### Heading)
function renderHeading(doc, text, x, y, pageBottom, margin) {
  if (y > pageBottom) { doc.addPage(); y = margin; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(text, x, y);
  // reset styles for body right away; return y (no extra spacing here)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(33, 33, 33);
  return y;
}

const exportToPDF = () => {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 16;
  const pageBottom = pageHeight - margin;

  // Header
  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageWidth, 60, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("DigiStav | Validorix", margin, 38);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Exported: ${new Date().toLocaleString()}`, pageWidth - 200, 38);

  let y = 100;

  // Assistant Summary heading
 // Assistant Summary – centered document title
y = renderCenteredTitle(doc, "Assistant Summary", y, pageWidth);
y += 4; // tiny extra breathing room before paragraphs

  // Get and sanitize assistant text
  const lastAssistantMessage =
    messages.slice().reverse().find(m => m.role === "assistant")?.content || "No assistant response.";

  const clean = stripValidationJson(lastAssistantMessage);

  // Render line by line: headings and paragraphs with **bold**
  const lines = clean.split(/\n+/);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(33, 33, 33);

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) { y += 4; return; } // very small gap for empty lines
  
    // --- Headings: "### Heading"
    if (/^###\s+/.test(line)) {
      // Add space BEFORE every heading, including the second+ ones
      y += SPACING.headingGapBefore;
      const h = line.replace(/^###\s+/, "").trim();
      y = renderHeading(doc, h, margin, y, pageBottom, margin);
      // Add consistent space AFTER heading
      y += SPACING.headingGapAfter;
      return;
    }
  
    // --- Bullets: "- text" -> "• text"
    if (/^-\s+/.test(line)) {
      const bullet = "• " + line.replace(/^-\s+/, "");
      y = renderRichParagraph(
        doc, bullet, margin, y, contentWidth, SPACING.paraLine, pageBottom, margin
      );
      y += SPACING.bulletGap;
      return;
    }
  
    // --- Normal paragraph
    y = renderRichParagraph(
      doc, line, margin, y, contentWidth, SPACING.paraLine, pageBottom, margin
    );
    y += SPACING.paraGap;
  });
  
  // Validation Results table
  if (analysisResults.length > 0) {
    y += 10;
    y = renderHeading(doc, "Validation Results", margin, y, pageBottom, margin) - 8;

    const tableData = analysisResults.map(i => [i.status.toUpperCase(), i.text]);

    autoTable(doc, {
      startY: y,
      head: [["Status", "Description"]],
      body: tableData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10, cellPadding: 6, lineWidth: 0.1 },
      headStyles: { fillColor: BRAND_BLUE, textColor: 255, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 90, halign: "center" }, 1: { cellWidth: contentWidth - 90 } },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 0) {
          const val = String(data.cell.raw).toLowerCase();
          if (val.includes("success")) data.cell.styles.textColor = [0, 128, 0];
          else if (val.includes("error")) data.cell.styles.textColor = [220, 38, 38];
          else if (val.includes("warning")) data.cell.styles.textColor = [234, 179, 8];
        }
      }
    });
    y = doc.lastAutoTable.finalY + 20;
  }

  // Footer
  if (y > pageBottom - 24) { doc.addPage(); y = margin; }
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text("Generated automatically by DigiStav | Validorix Assistant", margin, y + 14);

  doc.save("validation-summary.pdf");
};
      const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

useEffect(() => {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}, [theme]);

const toggleTheme = () => {
  setTheme((prev) => (prev === "light" ? "dark" : "light"));
};
useEffect(() => {
  setPlaceholderText(rolePlaceholders[selectedRole]); // update on role change
  setShowPlaceholder(true); // reset visible state

  const timer = setTimeout(() => {
    setShowPlaceholder(false); // hide after 2 seconds
  }, 2000);

  return () => clearTimeout(timer);
}, [selectedRole]);

   return (
    <div className="dashboard-container">
  {/* Navbar */}
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
            <option>Investor</option>
            <option>Designer</option>
            <option>Site Manager</option>
            <option>Contractor</option>
            <option>Farmer</option>
          </select>
          <button className="theme-toggle-btn" onClick={toggleTheme}>
  {theme === "light" ? "🌙 Dark" : "☀️ Light"}
</button>

          <div className="lang-switcher-toggle">
            <div
              className={`lang-toggle ${selectedLanguage === "CS" ? "cs" : "en"}`}
              onClick={() =>
                setSelectedLanguage(selectedLanguage === "EN" ? "CS" : "EN")
              }
            >
              <div className="toggle-labels">
                <span>EN</span>
                <span>CS</span>
              </div>
              <div className="toggle-indicator" />
            </div>
            
          </div>

          {/* Profile dropdown */}
          <div className="profile-dropdown">
            <div
              className="profile-circle"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              👤
            </div>
            {showProfileMenu && (
              <div className="profile-menu">
                <button onClick={logout}>Logout</button>
              </div>
            )}
          </div>
          <Link className="theme-toggle-btn" to="/resources">Resources</Link>
        </div>
      </header>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Documents Panel */}
        <aside className="panel panel-docs">
          <div className="panel-title">Documents</div>

          <input
            type="file"
            accept=".pdf,.docx,.txt"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <button className="btn-add" onClick={() => fileInputRef.current.click()}>
            + Add Document
          </button>

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
                    onClick={() => {
                      setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
                    }}
                  >
                    ✖
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Chat Panel */}
        <section className="panel panel-chat">
          <div className="chat-log">
          {messages.map((msg, i) => (
  <div
    key={i}
    className={`chat-bubble ${
      msg.role === "user" ? "user-message" : "assistant-message"
    }`}
  >
    <div className="avatar">{msg.role === "user" ? "🙍" : "🤖"}</div>
    <div className="bubble-content">
      {msg.file ? (
        <div className="file-preview-card">
          <span className="file-icon">📄</span>
          <div className="file-details">
            <div className="file-name">{msg.file.name}</div>
            <div className="file-type">
              {msg.file.type || "Unknown Type"}
            </div>
          </div>
        </div>
      ) : msg.content === "typing..." ? (
        <AnimatedTyping />
      ) : msg.role === "assistant" ? (
        <TypewriterBubble text={cleanAssistantResponse(msg.content)} />
      ) : (
        <span>{msg.content}</span>
      )}
    </div>
  </div>
))}
          </div>

          <div className="chat-input-row">
          <input
  type="text"
  className="chat-textbox"
  value={userInput}
  onChange={(e) => setUserInput(e.target.value)}
  placeholder={showPlaceholder ? placeholderText : ""}
/>

            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={loading}
            >
              Chat
            </button>
          </div>
        </section>

        {/* Results Panel */}
        <aside className="panel panel-results">
          <div className="panel-title">Results</div>

          <div className="results-scrollable">
            <ul className="result-list">
              {analysisResults.length > 0 ? (
                analysisResults.map((item, idx) => (
                  <li key={idx}>
                    <span className={`status-icon ${item.status}`}>
                      {item.status === "success"
                        ? "✔"
                        : item.status === "warning"
                        ? "⚠"
                        : "✖"}
                    </span>
                    {item.text}
                  </li>
                ))
              ) : (
                <li className="placeholder">
                  No results yet. Ask the bot to analyze a document.
                </li>
              )}
            </ul>
          </div>

          <button className="export-btn" onClick={exportToPDF}>Export to PDF</button>

          
        </aside>
      </div>
    </div>
  );
}
