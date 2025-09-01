import React, { useEffect, useRef, useState } from "react";
import OpenAI from "openai";
import "./ChatBox.css";
import TypewriterBubble from "./TypewriterBubble";

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
  const fileInputRef = useRef();
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
      .replace(/【[^】]+】/g, "")                          // Remove garbage citations
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")  // Convert **bold** to <strong>
      .replace(/^###\s+(.*)$/gm, "<h3>$1</h3>")           // Convert ### headings to <h3>
      .replace(/\n{2,}/g, "<br/><br/>")                   // Paragraph breaks
      .replace(/\n/g, "<br/>")                            // Line breaks
      .trim();
  }
  
  
  const sendMessage = async () => {
    if (!userInput.trim() && selectedFiles.length === 0) return;
    if (!threadId) return;

    setLoading(true);

    const userMessage = userInput.trim() ? { role: "user", content: userInput } : null;
    const fileMessages = selectedFiles.map((file) => ({ role: "user", file }));
    const placeholder = { role: "assistant", content: "typing..." };

    setMessages((prev) => [...prev, ...fileMessages, ...(userMessage ? [userMessage] : []), placeholder]);
    setUserInput("");

    try {
      const uploadedFileIds = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("purpose", "assistants");

        const res = await fetch("https://api.openai.com/v1/files", {
          method: "POST",
          headers: { Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}` },
          body: formData,
        });

        const data = await res.json();
        if (data.id) uploadedFileIds.push(data.id);
      }

      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: `${roleInstructions[selectedRole]}\n\nUser Query: ${userInput || "[uploaded files]"}`,

        ...(uploadedFileIds.length > 0 && {
          attachments: uploadedFileIds.map((id) => ({
            file_id: id,
            tools: [{ type: "file_search" }],
          })),
        }),
      });

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

      setSelectedFiles([]);
    } catch (err) {
      console.error("Chat error:", err);
    }

    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <header className="header-bar">
        <div className="brand-title">NEO Builder <span className="sub-brand">| Validorix</span></div>
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

          <div className="lang-switcher">
            <button>EN</button>
            <button>CS</button>
          </div>
          <div className="profile-circle">👤</div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="main-layout">
        {/* Documents Panel */}
        <aside className="panel panel-docs">
  <div className="panel-title">Documents</div>

  {/* File Upload */}
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

  {/* File Previews */}
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
              <div key={i} className={`chat-bubble ${msg.role === "user" ? "user-message" : "assistant-message"}`}>
                <div className="avatar">{msg.role === "user" ? "🙍" : "🤖"}</div>
                <div className="bubble-content">
                  {msg.file ? (
                    <div className="file-preview-card">
                      <span className="file-icon">📄</span>
                      <div className="file-details">
                        <div className="file-name">{msg.file.name}</div>
                        <div className="file-type">{msg.file.type || "Unknown Type"}</div>
                      </div>
                    </div>
                  ) : msg.content === "typing..." ? (
                    <div className="typing-dots"><span></span><span></span><span></span></div>
                  ) : msg.role === "assistant" ? (
                    <div
  className="bubble-content"
  dangerouslySetInnerHTML={{ __html: cleanAssistantResponse(msg.content) }}
></div>


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
            <button className="chat-send-btn" onClick={sendMessage} disabled={loading}>
              Chat
            </button>
          </div>
        </section>

        {/* Results Panel */}
        <aside className="panel panel-results">
          <div className="panel-title">Results</div>
          <ul className="result-list">
            <li><span className="status-icon success">✔</span> Validation of BEP</li>
            <li><span className="status-icon success">✔</span> Project objectives clearly defined</li>
            <li><span className="status-icon error">✖</span> Conflicts with BIM standards detected</li>
            <li><span className="status-icon success">✔</span> Responsibilities and tasks established</li>
          </ul>
          <button className="export-btn">Export to PDF</button>
          <button className="export-btn">Export to CSV</button>
        </aside>
      </div>
    </div>
  );
}
