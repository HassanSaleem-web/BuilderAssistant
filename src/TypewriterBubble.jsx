import React, { useEffect, useState } from "react";

export default function TypewriterBubble({ text }) {
  const [displayed, setDisplayed] = useState("");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setDisplayed("");
    setIndex(0);
  }, [text]);

  useEffect(() => {
    if (!text) return;

    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayed((prev) => prev + text.charAt(index));
        setIndex(index + 1);
      }, 12);
      return () => clearTimeout(timeout);
    }
  }, [index, text]);

  return (
    <div
      className="typewriter-html"
      dangerouslySetInnerHTML={{ __html: displayed }}
    />
  );
}
