import React, { useEffect, useState } from "react";
import "./AnimatedTyping.css";

const phrases = [
  "Analyzing document…",
  "Extracting insights…",
  "Reviewing structure…",
  "Cross-checking data…",
  "Finalizing summary…",
  "Almost done…",
];

export default function AnimatedTyping() {
  const [currentPhrase, setCurrentPhrase] = useState(phrases[0]);
  const [dots, setDots] = useState("");

  useEffect(() => {
    const phraseInterval = setInterval(() => {
      setCurrentPhrase((prev) => {
        const idx = phrases.indexOf(prev);
        return phrases[(idx + 1) % phrases.length];
      });
    }, 3000);

    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);

    return () => {
      clearInterval(phraseInterval);
      clearInterval(dotsInterval);
    };
  }, []);

  return (
    <div className="animated-typing">
      <div className="dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span className="phrase">{currentPhrase.replace("…", "") + dots}</span>
    </div>
  );
}
