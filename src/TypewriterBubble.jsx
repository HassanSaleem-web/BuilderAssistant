import React, { useEffect, useState } from "react";

export default function TypewriterBubble({ text }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 15); // Adjust typing speed here (ms per char)
    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayedText}</span>;
}
