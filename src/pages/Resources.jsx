import React from "react";

// Edit this list as needed; paths are from /public
const DOCS = [
  { title: "BEP (sample)", path: "/Files/BEP.pdf" },
  { title: "Ceník MatrixReality (DOCX)", path: "/Files/Ceník MatrixReality.docx" },
  { title: "Plán realizace BIM (BEP) – vzor (2024-10)", path: "/Files/Plán realizace BIM (BEP) – příprava – vzor (2024-10).docx" },
  { title: "PLNÁ MOC (DOCX)", path: "/Files/PLNÁ MOC.docx" },
  { title: "Prirucka ČSN-EN-ISO-19650 (PDF)", path: "/Files/Prirucka-pro-aplikaci-ČSN-EN-ISO-19650_Agentura-CAS-1.pdf" },
  { title: "EIR – realizace – vzor (2024-10)", path: "/Files/Požadavky na výměnu informací (EIR) – realizace – vzor (2024-10).docx" },
  { title: "Roles (PDF)", path: "/Files/Roles.pdf" },
  { title: "RS Příloha 1 – BEP Protokol (PDF)", path: "/Files/RS_Příloha 1_BEP Protokol.pdf" },
  { title: "06a – Principy tvorby DIMS (2021-07)", path: "/Files/06a - Principy tvorby DIMS podle DSS pro pozemní stavby DUR (2021-07).pdf" },
  { title: "11 drobné stavby – volný režim (PDF)", path: "/Files/11 drobné stavby - stavby ve volném režimu.pdf" },
  { title: "12 jednoduché stavby – jako RD (PDF)", path: "/Files/12 jednoduché stavby - jako RD.pdf" },
];

export default function Resources() {
  return (
    <div className="panel" style={{ maxWidth: 900, margin: "32px auto" }}>
      <h2 style={{ marginTop: 0 }}>Resources</h2>
      <p>Download commonly used templates and guidance documents.</p>

      <ul className="result-list" style={{ marginTop: 12 }}>
        {DOCS.map((d) => {
          const href = encodeURI(d.path); // handles spaces/diacritics
          return (
            <li key={d.path} className="resources-item" style={{ display: "flex", alignItems: "center" }}>
              <span>{d.title}</span>
              <span style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
                <a href={href} target="_blank" rel="noopener noreferrer">Open</a>
                <a href={href} download>Download</a>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
