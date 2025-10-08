// src/utils/openRouterSummaries.js
import axios from "axios";

function sanitize(s = "") {
  return String(s)
    .replace(/```[\s\S]*?```/g, "")
    .replace(/【[^】]+】/g, "")
    .replace(/\s+\n/g, "\n")
    .trim();
}

export async function generateGrokSummary({
  messages = [],
  analysisResults = [],
  role = "Investor",
  language = "EN",
}) {
  const lastAssistant =
    messages.slice().reverse().find(m => m.role === "assistant")?.content || "";

  const recent = messages.slice(-10)
    .map(m => `${m.role.toUpperCase()}: ${sanitize(m.content || "")}`)
    .join("\n");

  const targetLang = language === "CS" ? "Czech" : "English";

  const contentPrompt = `
  You are a professional technical report writer preparing an executive-grade summary for ${role}.
  Write a concise, client-ready report in ${targetLang}.
  
  Guidelines:
  - Use plain UTF-8 text only (no Markdown, no HTML, no LaTeX, no special characters like *, #, &, <, >).
  - Structure the report with clear section headers such as:
    Executive Summary:
    Project Overview:
    Compliance Assessment:
    Key Strengths:
    Recommendations:
  - Keep paragraphs short (2–4 lines) and formatted for PDF printing.
  - Do not include bullet symbols or JSON.
  - Avoid using ampersands (&) or encoding artifacts (e.g., &nbsp;, &#123;, etc.).
  - The tone should be formal, neutral, and suitable for executives.
  
  Context Information:
  Role: ${role}
  Assistant’s previous output (raw):
  ${sanitize(lastAssistant) || "(none)"}
  
  Validation Results (for reference):
  ${JSON.stringify(analysisResults, null, 2)}
  
  Recent conversation transcript (for additional context):
  ${recent}
  
  Your task:
  Rewrite and elaborate the above information into a clean, polished, professional report.
  Ensure the output contains only human-readable text, properly sectioned and ready for PDF printing. Do not include any control, formatting, or private-use Unicode characters (U+0000–U+001F, U+200B–U+206F, U+E000–U+F8FF, U+D800–U+DFFF). Output plain printable UTF-8 only.

  `;
  
  let resultText = "";
  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "x-ai/grok-4-fast",   // use the free Grok model
        messages: [
          { role: "system", content: "You are a professional report writer." },
          { role: "user", content: contentPrompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "NEO Builder Export (Grok)",
        },
      }
    );
    resultText = res?.data?.choices?.[0]?.message?.content?.trim() || "";
  } catch (e) {
    console.error("Grok API error:", e?.response?.data || e?.message || e);
  }

  // fallback if empty or too short
  if (!resultText || resultText.length < 20) {
    const base = sanitize(lastAssistant);
    const resultsBlock = analysisResults.length
      ? ["### Validation Results", ...analysisResults.map(i => `- [${(i.status||"").toUpperCase()}] ${i.text}`)].join("\n")
      : "";
    resultText = `### Summary\n${base || "No assistant response available."}\n\n${resultsBlock}`;
  }

  return resultText;
}
