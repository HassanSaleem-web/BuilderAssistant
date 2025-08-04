import React, { useEffect, useState } from "react";
import OpenAI from "openai";

// Initialize OpenAI SDK
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

  useEffect(() => {
    const createThread = async () => {
      const thread = await openai.beta.threads.create();
      setThreadId(thread.id);
    };
    createThread();
  }, []);

  const handleFileChange = (e) => {
    setSelectedFiles(Array.from(e.target.files));
  };

  const escapeHtml = (unsafe) =>
    unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const formatAssistantMessage = (text) => {
    return escapeHtml(text)
      .replace(/【.*?†.*?†.*?】/g, "") // Remove citations
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
      .replace(/^- /gm, "• ") // Bullets
      .replace(/\n/g, "<br>"); // Line breaks
  };

  const sendMessage = async () => {
    if (!userInput.trim() || !threadId) return;
    setLoading(true);

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

      await openai.beta.threads.messages.create(threadId, {
        role: "user",
        content: userInput,
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
      const sorted = response.data
        .slice()
        .reverse()
        .map((m) => ({
          role: m.role,
          content: m.content[0]?.text?.value || "",
        }));

      setMessages(sorted);
      setUserInput("");
      setSelectedFiles([]);
    } catch (err) {
      console.error("Chat error:", err);
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: 20 }}>
      <h2>💬 Chat with Assistant</h2>
      <div
        style={{
          border: "1px solid #ccc",
          padding: 10,
          height: 300,
          overflowY: "auto",
          marginBottom: 10,
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: "1em" }}>
            <strong>{msg.role === "user" ? "🧍 You" : "🤖 Assistant"}:</strong>
            {msg.role === "user" ? (
              <div>{msg.content}</div>
            ) : (
              <div
                style={{ whiteSpace: "pre-wrap" }}
                dangerouslySetInnerHTML={{
                  __html: formatAssistantMessage(msg.content),
                }}
              />
            )}
          </div>
        ))}
      </div>

      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        rows={3}
        style={{ width: "100%", marginBottom: 10 }}
        placeholder="Type your message..."
      />

      <input
        type="file"
        multiple
        onChange={handleFileChange}
        style={{ marginBottom: 10 }}
      />

      <button onClick={sendMessage} disabled={loading}>
        {loading ? "Thinking..." : "Send"}
      </button>
    </div>
  );
}
