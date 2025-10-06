import React, { useEffect, useRef, useState } from "react";
import OpenAI from "openai";
import "./ChatBox.css";
import TypewriterBubble from "./TypewriterBubble";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";

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
    return text
      .replace(/【[^】]+】/g, "")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/^###\s+(.*)$/gm, "<h3>$1</h3>")
      .replace(/\n{2,}/g, "<br/><br/>")
      .replace(/\n/g, "<br/>")
      .trim();
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
  const exportToPDF = () => {
    const doc = new jsPDF();
    const title = "NEO Builder | Validorix";
    const date = new Date().toLocaleString();
  
    // Header
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 20);
  
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    doc.text(`Exported: ${date}`, 14, 27);
  
    // Assistant response
    const lastAssistantMessage = messages
      .slice()
      .reverse()
      .find((msg) => msg.role === "assistant")?.content || "No assistant response.";
  
    doc.setFontSize(12);
    doc.setTextColor(33, 33, 33);
    doc.text("Assistant Summary:", 14, 40);
  
    // Clean & format content
    const rawLines = lastAssistantMessage
      .replace(/<[^>]+>/g, "") // Strip HTML
      .split("\n")             // Split by lines
      .map((line) => line.trim())
      .filter(Boolean);
  
    let y = 47;
    doc.setFontSize(11);
    rawLines.forEach((line) => {
      if (/^\*\*(.+?)\*\*$/.test(line)) {
        // Proper heading format with **heading**
        const headingText = line.replace(/\*\*/g, "");
        doc.setFont("helvetica", "bold");
        doc.setTextColor(20, 20, 20);
        doc.text(headingText, 14, y);
        y += 8;
      } else {
        // Wrap and print normal content
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50);
        const wrapped = doc.splitTextToSize(line, 180);
        wrapped.forEach((wLine) => {
          doc.text(wLine, 14, y);
          y += 6;
        });
      }
  
      // Avoid content going off the page
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
  
    // Table of validation results
    if (analysisResults.length > 0) {
      const tableData = analysisResults.map((item) => [
        item.status.toUpperCase(),
        item.text,
      ]);
  
      autoTable(doc, {
        startY: y + 5,
        head: [["Status", "Description"]],
        body: tableData,
        styles: {
          fontSize: 10,
          cellPadding: 4,
        },
        headStyles: {
          fillColor: [30, 144, 255],
          textColor: 255,
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 150 },
        },
        didParseCell: function (data) {
          if (data.section === "body") {
            if (data.cell.raw.includes("SUCCESS")) {
              data.cell.styles.textColor = [0, 128, 0];
            } else if (data.cell.raw.includes("ERROR")) {
              data.cell.styles.textColor = [255, 0, 0];
            } else if (data.cell.raw.includes("WARNING")) {
              data.cell.styles.textColor = [255, 165, 0];
            }
          }
        },
      });
    } else {
      doc.text("No validation results to display.", 14, y + 10);
    }
  
    doc.save("validation-summary.pdf");
  };
   return (
    <div className="dashboard-container">
  {/* Navbar */}
      <header className="header-bar">
        <div className="brand-title">
          NEO Builder <span className="sub-brand">| Validorix</span>
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
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
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
              placeholder="Can you validate the BEP document?"
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
