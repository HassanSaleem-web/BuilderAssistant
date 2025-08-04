import axios from "axios";

// Load API key from .env (prefixed for Vite)
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

// Sends user question + list of available filenames
// Mistral responds with a JSON array of selected filenames
export async function getRelevantFiles(userQuestion, fileNames = []) {
  const prompt = `
You are an AI assistant for a BIM project. A user will ask a technical or procedural question related to construction, modeling, or project files. You are given a list of filenames from the local directory.

Your job is to select only the most relevant files (1–3 max) that should be referenced to answer the user's question.

Return your response strictly as a JSON array of filenames, like:
["BEP_Protocol.pdf", "Coordination_Guide.docx"]
  
Do NOT include any explanation or additional text.

User question: ${userQuestion}

Available files: ${JSON.stringify(fileNames)}
`;

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          { role: "system", content: "You are a file selection assistant for a BIM AI project." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const content = response.data.choices?.[0]?.message?.content || "[]";
    const selectedFiles = JSON.parse(content);
    return selectedFiles;
  } catch (error) {
    console.error("❌ Mistral file selection error:", error.message);
    return [];
  }
}
