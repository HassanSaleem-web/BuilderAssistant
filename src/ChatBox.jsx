// import React, { useEffect, useRef, useState } from "react";
// import OpenAI from "openai";
// import "./ChatBox.css";
// import TypewriterBubble from "./TypewriterBubble";
// import { useNavigate } from "react-router-dom";
// import { useAuth } from "./auth/AuthContext.jsx";
// import AnimatedTyping from "./AnimatedTyping";
// import { Link } from "react-router-dom";
// import { generateGrokSummary } from "./utils/mistralExport.js";
// import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
// import { saveAs } from "file-saver";

// // ✅ Dynamic Mammoth import — always works in browser




// const openai = new OpenAI({
//   apiKey: import.meta.env.VITE_OPENAI_API_KEY,
//   dangerouslyAllowBrowser: true,
// });

// export default function ChatBox() {
//   const [assistantId] = useState(import.meta.env.VITE_ASSISTANT_ID);
//   const [threadId, setThreadId] = useState(null);
//   const [userInput, setUserInput] = useState("");
//   const [messages, setMessages] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedFiles, setSelectedFiles] = useState([]);
//   const [selectedRole, setSelectedRole] = useState("Investor");
//   const [selectedLanguage, setSelectedLanguage] = useState("EN");
//   const [analysisResults, setAnalysisResults] = useState([]);
//   const [showProfileMenu, setShowProfileMenu] = useState(false);
//   const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
//   const [exportLoading, setExportLoading] = useState({ txt: false, docx: false });
//   const navigate = useNavigate();
// // Dynamic placeholder text per role
// const rolePlaceholders = {
//   Investor: "Check if my documentation meets Czech standards.",
//   Designer: "Validate BEP structure and missing sections.",
//   "Site Manager": "Review safety and inspection checklist.",
//   Contractor: "Generate delivery checklist for the client.",
//   Farmer: "Validate documents for grant applications."
// };

// const [placeholderText, setPlaceholderText] = useState(rolePlaceholders[selectedRole]);
// const [showPlaceholder, setShowPlaceholder] = useState(true);

//   const fileInputRef = useRef();
//   const { logout } = useAuth();

//   const roleInstructions = {
//     Investor: `You are responding to an Investor. Keep your response high-level, non-technical, focused on compliance, documentation readiness, and project confidence. Avoid deep technical language.`,
//     Designer: `You are responding to a Designer (Architect or Engineer). Your response should include detailed legal or technical references based on Czech norms and BEP validation rules.`,
//     "Site Manager": `You are responding to a Site Manager. Use step-by-step, checklist-style validation. Avoid complexity. Prioritize readiness, safety, and version control.`,
//     Contractor: `You are responding to a Contractor or Freelancer. Be clear and direct. Help with cost estimation, compliance for deliverables, and document handover preparation.`,
//     Farmer: `You are responding to a Farmer involved in subsidy projects. Give clear, supportive steps focused on document validation and subsidy eligibility.`,
//   };

//   useEffect(() => {
//     const createThread = async () => {
//       const thread = await openai.beta.threads.create();
//       setThreadId(thread.id);
//     };
//     createThread();
//   }, []);

//   const handleFileChange = (e) => {
//     const files = Array.from(e.target.files).filter((file) =>
//       ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"].includes(file.type)
//     );
//     setSelectedFiles((prev) => [...prev, ...files]);
//   };

//   function cleanAssistantResponse(text) {
//     if (!text) return "";
  
//     const cleaned = text
//       // Remove “JSON Array with Key Results” section only, keeping content after it
//       .replace(/JSON\s*Array\s*with\s*Key\s*Results[\s\S]*?```(?:json)?[\s\S]*?```/gi, "")
//       // Clean leftover stray JSON arrays outside code fences
//       .replace(/\[[\s\S]*?\]/g, "")
//       // Remove dangling backticks and commas left behind
//       .replace(/```/g, "")
//       .replace(/,+\s*$/gm, "")
//       // Remove OpenAI references
//       .replace(/【[^】]+】/g, "")
//       // Remove any line containing “json” (case-insensitive)
//       .replace(/^.*\bjson\b.*$/gim, "")
//       // Markdown: bold and headers
//       .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
//       .replace(/^###\s+(.*)$/gm, "<h3>$1</h3>")
//       .replace(/^####\s+(.*)$/gm, "<h4>$1</h4>")
//       // Replace newlines with HTML line breaks
//       .replace(/\n{2,}/g, "<br/><br/>")
//       .replace(/\n/g, "<br/>")
//       .trim();
  
//     return cleaned;
//   }
//   const sendMessage = async () => {
//     if (!userInput.trim() || !threadId) return;
//     setLoading(true);

//     const userMessage = { role: "user", content: userInput };
//     const placeholder = { role: "assistant", content: "typing..." };
//     setMessages((prev) => [...prev, userMessage, placeholder]);
//     setUserInput("");

//     try {
//       const uploadedFileIds = [];
      

//       for (const file of selectedFiles) {
//         const formData = new FormData();
//         formData.append("file", file);
//         formData.append("purpose", "assistants");

//         const res = await fetch("https://api.openai.com/v1/files", {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
//           },
//           body: formData,
//         });

//         const data = await res.json();
//         if (data.id) uploadedFileIds.push(data.id);
//       }

//       const uploadedFileNames = selectedFiles.map((f) => f.name).join(", ") || "None";

//       const contentToSend = `
//       You are a helpful assistant.
      
//       The user may upload documents (${uploadedFileNames}), but DO NOT reference, name, or analyze these documents **unless** they explicitly ask for it in their message.
      
//       ⛔️ If the user does not request validation, analysis, review, or feedback — DO NOT mention the files. Just reply to the user’s question normally.
      
//       ✅ If the user **does** ask to "validate", "analyze", or "review" a document, then:
//       - DO perform the validation.
//       - DO return your final response as a short summary **AND** a JSON array with key results.
      
//       🟩 ALWAYS include this JSON array in your response when analysis is requested:
//       [
//         {"status": "success", "text": "What was validated successfully"},
//         {"status": "error", "text": "What issues or missing elements were found"}
//       ]
      
//       Role Context: ${roleInstructions[selectedRole]}
//       ${selectedLanguage === "CS" ? "Please respond in Czech." : ""}
      
//       User Message:
//       "${userInput}"
//       `;
      


//       const messagePayload = {
//         role: "user",
//         content: contentToSend,
//         ...(uploadedFileIds.length > 0 && {
//           attachments: uploadedFileIds.map((id) => ({
//             file_id: id,
//             tools: [{ type: "file_search" }],
//           })),
//         }),
//       };

//       await openai.beta.threads.messages.create(threadId, messagePayload);

//       const run = await openai.beta.threads.runs.create(threadId, {
//         assistant_id: assistantId,
//       });

//       let runStatus;
//       do {
//         await new Promise((r) => setTimeout(r, 1000));
//         runStatus = await openai.beta.threads.runs.retrieve(run.id, {
//           thread_id: threadId,
//         });
//       } while (runStatus.status !== "completed");

//       const response = await openai.beta.threads.messages.list(threadId);
//       const latestAssistant = response.data.find((m) => m.role === "assistant");
//       const assistantContent = latestAssistant?.content[0]?.text?.value || "";

//       const resultRegex = /\[.*?\]/s;
//       const match = assistantContent.match(resultRegex);
//       let structuredResults = [];

//       if (match) {
//         try {
//           structuredResults = JSON.parse(match[0]);
//         } catch (err) {
//           console.warn("Could not parse JSON result:", err);
//         }
//       }

//       setAnalysisResults(structuredResults);
//       setMessages((prev) => {
//         const updated = [...prev];
//         const typingIndex = updated.findIndex((m) => m.content === "typing...");
//         if (typingIndex !== -1) {
//           updated[typingIndex] = { role: "assistant", content: assistantContent };
//         } else {
//           updated.push({ role: "assistant", content: assistantContent });
//         }
//         return updated;
//       });
//     } catch (err) {
//       console.error("Chat error:", err);
//     }

//     setLoading(false);
//   };
//   // --- PDF text utilities ---
// const BRAND_BLUE = [37, 99, 235];

// function stripValidationJson(source) {
//   let txt = source || "";

//   // remove “### JSON Array with Key Results” section only (keep what comes after)
//   txt = txt.replace(/###\s*JSON\s*Array\s*with\s*Key\s*Results[\s\S]*?```(?:json)?[\s\S]*?```/gi, "");

//   // remove any remaining fenced code blocks
//   txt = txt.replace(/```[\s\S]*?```/g, "");

//   // remove stray JSON arrays left outside code fences (defensive)
//   txt = txt.replace(/^\s*\[[\s\S]*?\]\s*$/gm, "");

//   // remove OpenAI-style footnote tags and leftover garbage bytes/entities
//   txt = txt.replace(/【[^】]+】/g, "")
//            .replace(/&[a-z0-9#]+;/gi, "")
//            .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u024F]/g, "");

//   // normalize newlines
//   txt = txt.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
//   return txt;
// }

// // Render a paragraph that may contain **bold** segments, with word-wrapping
// function renderRichParagraph(doc, text, x, y, maxWidth, lineHeight, pageBottom, margin) {
//   const segments = text.split(/\*\*(.+?)\*\*/g) // odd indexes are bold
//                        .map((seg, i) => ({ text: seg, bold: i % 2 === 1 }))
//                        .filter(s => s.text.length);

//   let currX = x;
//   let currY = y;

//   const pushLine = (line, isBold) => {
//     if (currY > pageBottom) {
//       doc.addPage();
//       currY = margin;
//     }
//     doc.setFont("helvetica", isBold ? "bold" : "normal");
//     doc.text(line, currX, currY);
//   };

//   // break segments by words and wrap intelligently
//   let line = "";
//   let lineBoldMask = []; // parallel mask of which chars are bold; we’ll render per chunk
//   const flush = () => {
//     if (!line) return;
//     // render a mixed-style line by slicing consecutive bold/plain chunks
//     let idx = 0;
//     while (idx < line.length) {
//       const state = lineBoldMask[idx];
//       let j = idx;
//       while (j < line.length && lineBoldMask[j] === state) j++;
//       const slice = line.slice(idx, j);
//       doc.setFont("helvetica", state ? "bold" : "normal");
//       doc.text(slice, currX, currY, { baseline: "top" });
//       currX += doc.getTextWidth(slice + " ");
//       idx = j;
//     }
//     currX = x;
//     currY += lineHeight;
//     line = "";
//     lineBoldMask = [];
//   };

//   const spaceWidth = doc.getTextWidth(" ");
//   const appendWord = (word, isBold) => {
//     const wordWidth = doc.getTextWidth(word);
//     const lineWidth = doc.getTextWidth(line);

//     if (lineWidth + (line ? spaceWidth : 0) + wordWidth > maxWidth) {
//       flush();
//     }
//     if (line) {
//       line += " ";
//       lineBoldMask.push(...Array(1).fill(false)); // space non-bold, visual spacing
//     }
//     line += word;
//     lineBoldMask.push(...Array(word.length).fill(isBold));
//   };

//   // iterate words preserving bold state
//   segments.forEach(seg => {
//     const words = seg.text.split(/\s+/).filter(Boolean);
//     words.forEach(w => appendWord(w, seg.bold));
//   });
//   flush();

//   return currY;
// }
// // Consistent vertical rhythm for PDF
// const SPACING = {
//   paraLine: 16,          // baseline line height
//   paraGap: 6,            // after normal paragraphs
//   bulletGap: 4,          // after bullet paragraphs
//   headingGapBefore: 12,  // space before each ### heading
//   headingGapAfter: 20,     // space after each heading
// };
// function renderCenteredTitle(doc, text, y, pageWidth, color = [37, 99, 235]) {
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(16);              // title size
//   doc.setTextColor(...color);
//   doc.text(text, pageWidth / 2, y, { align: "center" });

//   // optional thin underline (60% width, centered)
//   const underlineWidth = pageWidth * 0.60;
//   const startX = (pageWidth - underlineWidth) / 2;
//   doc.setDrawColor(...color);
//   doc.setLineWidth(0.75);
//   doc.line(startX, y + 6, startX + underlineWidth, y + 6);

//   // reset defaults for body
//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(11);
//   doc.setTextColor(33, 33, 33);

//   return y + 18; // spacing after title
// }

// // Render a heading line (### Heading)
// function renderHeading(doc, text, x, y, pageBottom, margin) {
//   if (y > pageBottom) { doc.addPage(); y = margin; }
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(12);
//   doc.setTextColor(...BRAND_BLUE);
//   doc.text(text, x, y);
//   // reset styles for body right away; return y (no extra spacing here)
//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(11);
//   doc.setTextColor(33, 33, 33);
//   return y;
// }

// // New Export Handler

// // --- Export Handlers with Button-Specific Loading States ---

// const exportToTXT = async () => {
//   try {
//     setExportLoading((p) => ({ ...p, txt: true }));

//     const summaryText = await generateGrokSummary({
//       messages,
//       analysisResults,
//       role: selectedRole,
//       language: selectedLanguage,
//     });

//     const cleaned = summaryText
//       .replace(/\u0000/g, "")
//       .replace(/[\u200B-\u200F\uFEFF]/g, "")
//       .replace(/[^\P{C}\n]/gu, " ")
//       .normalize("NFC")
//       .trim();

//     const title = "DigiStav | Validorix Report";
//     const date = `Exported: ${new Date().toLocaleString()}`;
//     const header = `${title}\n\n${date}\n\n------------------------------------------\n\n`;
//     const fullText = header + cleaned + "\n";

//     const txtBlob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
//     const txtUrl = URL.createObjectURL(txtBlob);
//     const txtLink = document.createElement("a");
//     txtLink.href = txtUrl;
//     txtLink.download = "NEO_Builder_Report.txt";
//     txtLink.click();
//     URL.revokeObjectURL(txtUrl);
//   } catch (err) {
//     console.error("TXT export failed:", err);
//     alert("Failed to export TXT file. Check console for details.");
//   } finally {
//     setExportLoading((p) => ({ ...p, txt: false }));
//   }
// };

// const exportToDOCX = async () => {
//   try {
//     setExportLoading((p) => ({ ...p, docx: true }));

//     const summaryText = await generateGrokSummary({
//       messages,
//       analysisResults,
//       role: selectedRole,
//       language: selectedLanguage,
//     });

//     const cleaned = summaryText
//       .replace(/\u0000/g, "")
//       .replace(/[\u200B-\u200F\uFEFF]/g, "")
//       .replace(/[^\P{C}\n]/gu, " ")
//       .normalize("NFC")
//       .trim();

//     const title = "DigiStav | Validorix Report";
//     const date = `Exported: ${new Date().toLocaleString()}`;
//     const fullText = `${title}\n\n${date}\n\n------------------------------------------\n\n${cleaned}\n`;

//     const txtBlob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
//     const textFromFile = await txtBlob.text();

//     const doc = new Document({
//       styles: {
//         paragraphStyles: [
//           {
//             id: "TitleStyle",
//             name: "TitleStyle",
//             run: { size: 36, bold: true, color: "FFFFFF" },
//             paragraph: {
//               alignment: "center",
//               spacing: { after: 400 },
//               shading: { fill: "2563EB" },
//             },
//           },
//           {
//             id: "HeadingStyle",
//             name: "HeadingStyle",
//             run: { bold: true, color: "2563EB", size: 26 },
//             paragraph: {
//               spacing: { before: 300, after: 120 },
//               alignment: "left",
//             },
//           },
//           {
//             id: "BodyText",
//             name: "BodyText",
//             run: { size: 22, color: "1F2937" },
//             paragraph: {
//               spacing: { line: 300, after: 160 },
//               alignment: "justify",
//             },
//           },
//           {
//             id: "FooterText",
//             name: "FooterText",
//             run: { color: "808080", italics: true, size: 18 },
//             paragraph: {
//               alignment: "center",
//               spacing: { before: 600 },
//             },
//           },
//         ],
//       },
//       sections: [
//         {
//           properties: {
//             page: {
//               margin: { top: 720, bottom: 720, left: 720, right: 720 },
//             },
//           },
//           children: [
//             new Paragraph({ text: title, style: "TitleStyle" }),
//             new Paragraph({ text: date, alignment: "center", style: "BodyText" }),

//             ...textFromFile.split(/\n+/).map((line) => {
//               const trimmed = line.trim();
//               if (!trimmed) return new Paragraph("");
//               if (/^([A-Z][A-Za-z\s]+:)/.test(trimmed)) {
//                 return new Paragraph({
//                   text: trimmed.replace(":", "").trim(),
//                   style: "HeadingStyle",
//                 });
//               } else {
//                 return new Paragraph({ text: trimmed, style: "BodyText" });
//               }
//             }),

//             new Paragraph({
//               text: "Generated automatically by DigiStav | Validorix Assistant",
//               style: "FooterText",
//             }),
//           ],
//         },
//       ],
//     });

//     const docxBlob = await Packer.toBlob(doc);
//     saveAs(docxBlob, "NEO_Builder_Report.docx");
//   } catch (err) {
//     console.error("DOCX export failed:", err);
//     alert("Failed to export DOCX file. Check console for details.");
//   } finally {
//     setExportLoading((p) => ({ ...p, docx: false }));
//   }
// };

// useEffect(() => {
//   document.body.setAttribute("data-theme", theme);
//   localStorage.setItem("theme", theme);
// }, [theme]);

// const toggleTheme = () => {
//   setTheme((prev) => (prev === "light" ? "dark" : "light"));
// };
// useEffect(() => {
//   setPlaceholderText(rolePlaceholders[selectedRole]); // update on role change
//   setShowPlaceholder(true); // reset visible state

//   const timer = setTimeout(() => {
//     setShowPlaceholder(false); // hide after 2 seconds
//   }, 2000);

//   return () => clearTimeout(timer);
// }, [selectedRole]);

//    return (
//     <div className="dashboard-container">
//   {/* Navbar */}
//       <header className="header-bar">
//         <div className="brand-title">
//         DigiStav <span className="sub-brand">| Validorix</span>
//         </div>
//         <div className="controls">
//           <select
//             className="role-selector"
//             value={selectedRole}
//             onChange={(e) => setSelectedRole(e.target.value)}
//           >
//             <option>Investor</option>
//             <option>Designer</option>
//             <option>Site Manager</option>
//             <option>Contractor</option>
//             <option>Farmer</option>
//           </select>
//           <button className="theme-toggle-btn" onClick={toggleTheme}>
//   {theme === "light" ? "🌙 Dark" : "☀️ Light"}
// </button>

//           <div className="lang-switcher-toggle">
//             <div
//               className={`lang-toggle ${selectedLanguage === "CS" ? "cs" : "en"}`}
//               onClick={() =>
//                 setSelectedLanguage(selectedLanguage === "EN" ? "CS" : "EN")
//               }
//             >
//               <div className="toggle-labels">
//                 <span>EN</span>
//                 <span>CS</span>
//               </div>
//               <div className="toggle-indicator" />
//             </div>
            
//           </div>

//           {/* Profile dropdown */}
//           <div className="profile-dropdown">
//             <div
//               className="profile-circle"
//               onClick={() => setShowProfileMenu(!showProfileMenu)}
//             >
//               👤
//             </div>
//             {showProfileMenu && (
//               <div className="profile-menu">
//                 <button onClick={logout}>Logout</button>
//               </div>
//             )}
//           </div>
          
//         </div>
//       </header>

//       {/* Main Layout */}
//       <div className="main-layout">
//         {/* Documents Panel */}
//         <aside className="panel panel-docs">
//           <div className="panel-title">Documents</div>

//           <input
//             type="file"
//             accept=".pdf,.docx,.txt"
//             multiple
//             ref={fileInputRef}
//             onChange={handleFileChange}
//             style={{ display: "none" }}
//           />
//           <button className="btn-add" onClick={() => fileInputRef.current.click()}>
//             + Add Document
//           </button>

//           {selectedFiles.length > 0 && (
//             <div className="file-preview-container">
//               {selectedFiles.map((file, index) => (
//                 <div key={index} className="file-preview-card">
//                   <span className="file-icon">📄</span>
//                   <div className="file-details">
//                     <div className="file-name">{file.name}</div>
//                     <div className="file-type">{file.type || "Unknown Type"}</div>
//                   </div>
//                   <button
//                     className="file-remove"
//                     onClick={() => {
//                       setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
//                     }}
//                   >
//                     ✖
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//         </aside>

//         {/* Chat Panel */}
//         <section className="panel panel-chat">
//           <div className="chat-log">
//           {messages.map((msg, i) => (
//   <div
//     key={i}
//     className={`chat-bubble ${
//       msg.role === "user" ? "user-message" : "assistant-message"
//     }`}
//   >
//     <div className="avatar">{msg.role === "user" ? "🙍" : "🤖"}</div>
//     <div className="bubble-content">
//       {msg.file ? (
//         <div className="file-preview-card">
//           <span className="file-icon">📄</span>
//           <div className="file-details">
//             <div className="file-name">{msg.file.name}</div>
//             <div className="file-type">
//               {msg.file.type || "Unknown Type"}
//             </div>
//           </div>
//         </div>
//       ) : msg.content === "typing..." ? (
//         <AnimatedTyping />
//       ) : msg.role === "assistant" ? (
//         <TypewriterBubble text={cleanAssistantResponse(msg.content)} />
//       ) : (
//         <span>{msg.content}</span>
//       )}
//     </div>
//   </div>
// ))}
//           </div>

//           <div className="chat-input-row">
//           <input
//   type="text"
//   className="chat-textbox"
//   value={userInput}
//   onChange={(e) => setUserInput(e.target.value)}
//   placeholder={showPlaceholder ? placeholderText : ""}
// />

//             <button
//               className="chat-send-btn"
//               onClick={sendMessage}
//               disabled={loading}
//             >
//               Chat
//             </button>
//           </div>
//         </section>

//         {/* Results Panel */}
//         <aside className="panel panel-results">
//           <div className="panel-title">Results</div>

//           <div className="results-scrollable">
//             <ul className="result-list">
//               {analysisResults.length > 0 ? (
//                 analysisResults.map((item, idx) => (
//                   <li key={idx}>
//                     <span className={`status-icon ${item.status}`}>
//                       {item.status === "success"
//                         ? "✔"
//                         : item.status === "warning"
//                         ? "⚠"
//                         : "✖"}
//                     </span>
//                     {item.text}
//                   </li>
//                 ))
//               ) : (
//                 <li className="placeholder">
//                   No results yet. Ask the bot to analyze a document.
//                 </li>
//               )}
//             </ul>
//           </div>

//           <div className="export-buttons">
//   <button
//     className="export-btn"
//     onClick={exportToTXT}
//     disabled={exportLoading.txt}
//   >
//     {exportLoading.txt ? "Generating TXT..." : "Export TXT"}
//   </button>

//   <button
//     className="export-btn"
//     onClick={exportToDOCX}
//     disabled={exportLoading.docx}
//   >
//     {exportLoading.docx ? "Generating DOCX..." : "Export DOCX"}
//   </button>
// </div>


          
//         </aside>
//       </div>
//     </div>
//   );
// }
// src/ChatBox.jsx
import React, { useEffect, useRef, useState } from "react";
import "./ChatBox.css";
import TypewriterBubble from "./TypewriterBubble";
import AnimatedTyping from "./AnimatedTyping";
import { useAuth } from "./auth/AuthContext.jsx";
import { saveAs } from "file-saver";




export default function ChatBox() {
  const [creditAnim, setCreditAnim] = useState(false);

  const { user, setUser } = useAuth();
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedRole, setSelectedRole] = useState("Investor");
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [exportLoading, setExportLoading] = useState({ txt: false, docx: false });
  const fileInputRef = useRef();
  const { logout } = useAuth();

  /* ------------------------------
     Dynamic placeholders
  ------------------------------ */
  const rolePlaceholders = {
    Investor: "Check if my documentation meets Czech standards.",
    Designer: "Validate BEP structure and missing sections.",
    "Site Manager": "Review safety and inspection checklist.",
    Contractor: "Generate delivery checklist for the client.",
    Farmer: "Validate documents for grant applications.",
  };
  const [placeholderText, setPlaceholderText] = useState(rolePlaceholders[selectedRole]);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  useEffect(() => {
    setPlaceholderText(rolePlaceholders[selectedRole]);
    setShowPlaceholder(true);
    const timer = setTimeout(() => setShowPlaceholder(false), 2500);
    return () => clearTimeout(timer);
  }, [selectedRole]);

  /* ------------------------------
     Theme control
  ------------------------------ */
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

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
   /* ------------------------------
     File handling
  ------------------------------ */
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).filter((file) =>
      ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"].includes(file.type)
    );
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  /* ------------------------------
     Send message → backend
  ------------------------------ */
  const sendMessage = async () => {
    if (!userInput.trim()) return;
    setLoading(true);
  
    const userMessage = { role: "user", content: userInput };
    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "typing..." }]);
    setUserInput("");
  
    try {
      const formData = new FormData();
      formData.append("message", userInput);
      formData.append("role", selectedRole);
      formData.append("language", selectedLanguage);
      selectedFiles.forEach((f) => formData.append("files", f));
  
      const res = await fetch("https://builderbackend-v7n4.onrender.com/api/ask", {
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
  
  /* ------------------------------
     Export summary (TXT / DOCX)
  ------------------------------ */
  const exportSummary = async (format = "txt") => {
    try {
      setExportLoading((p) => ({ ...p, [format]: true }));
      const res = await fetch("https://builderbackend-v7n4.onrender.com/api/export", {
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

      {/* Layout */}
      <div className="main-layout">
        {/* Documents */}
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
              {loading ? "Sending..." : "Chat"}
            </button>
          </div>
        </section>

        {/* Results */}
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

          <div className="export-buttons">
            <button
              className="export-btn"
              onClick={() => exportSummary("txt")}
              disabled={exportLoading.txt}
            >
              {exportLoading.txt ? "Generating TXT..." : "Export TXT"}
            </button>
            <button
              className="export-btn"
              onClick={() => exportSummary("docx")}
              disabled={exportLoading.docx}
            >
              {exportLoading.docx ? "Generating DOCX..." : "Export DOCX"}
            </button>
          </div>
        </aside>
         {user && (
  <div className={`credit-display ${creditAnim ? "credit-anim" : ""}`}>
    <div className="credit-dot" />
    <span>{user.creditsLeft} free credits remaining</span>
  </div>
)} 

      </div>
      

    </div>
  );
}
