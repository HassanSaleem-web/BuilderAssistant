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
import { useNavigate } from "react-router-dom";
import { FiCreditCard, FiLogOut, FiChevronRight } from "react-icons/fi";
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

  const { user, setUser } = useAuth();
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedRole, setSelectedRole] = useState("investor");
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [exportLoading, setExportLoading] = useState({ txt: false, docx: false });
  const fileInputRef = useRef();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showBuyWarning, setShowBuyWarning] = useState(false);
  const [showNoCreditsModal, setShowNoCreditsModal] = useState(false);
  const [userDocs, setUserDocs] = useState([]);

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
      ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"].includes(file.type)
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
    accept=".pdf,.docx,.txt"
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
