"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchServerInfo() {
      try {
        const res = await fetch("/api/auth/serverInfo");
        if (!res.ok) throw new Error("Failed to fetch server info");
        const data = await res.json();
        setServerInfo(data);
      } catch (err) {
        setError("Could not load server info");
      } finally {
        setLoading(false);
      }
    }
    fetchServerInfo();
  }, []);

  // Use sidebarTitle as webName if available, else fallback
  const appName = serverInfo?.webName || process.env.NEXT_PUBLIC_APP_NAME || "PW Quantum";
  const fullText = `Welcome to ${appName}`;
  const phrases = [
    { text: `Welcome to ${appName}`, color: "!text-cyan-300" },
    { text: "Your Study Companion", color: "!text-violet-400" },
    { text: "Learn. Code. Grow.", color: "!text-emerald-500" },
  ];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const currentPhrase = phrases[currentPhraseIndex].text;

    const handleTyping = () => {
      if (!isDeleting) {
        // Typing forward
        setDisplayedText(currentPhrase.slice(0, displayedText.length + 1));

        if (displayedText.length + 1 === currentPhrase.length) {
          // Pause before deleting
          setIsDeleting(true);
          setTypingSpeed(1000);
        } else {
          setTypingSpeed(150);
        }
      } else {
        // Deleting backward
        setDisplayedText(currentPhrase.slice(0, displayedText.length - 1));

        if (displayedText.length - 1 === 0) {
          // Move to next phrase after pause
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % phrases.length);
          setTypingSpeed(500);
        } else {
          setTypingSpeed(100);
        }
      }
    };

    timeoutId = setTimeout(handleTyping, typingSpeed);

    return () => clearTimeout(timeoutId);
  }, [displayedText, isDeleting, typingSpeed, currentPhraseIndex, phrases]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="w-full bg-gray-900 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-center">
          <h1 className="text-xl font-bold text-purple-400">{appName}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col justify-center items-center px-6 text-center p-6 animate-fadeSlideUp">
        <h2
          className={`text-5xl font-extrabold mb-6 tracking-tight bg-clip-text text-transparent  min-h-[3rem] ${phrases[currentPhraseIndex].color}`}
        >
          {displayedText}
          <span className="blinking-cursor">|</span>
        </h2>

        <p className="max-w-md mb-12 text-gray-300">
          Your personal study companion. Log in to start or continue your
          learning journey.
        </p>

        <div className="flex gap-6 flex-wrap text-center justify-center">
          <a
            href="/auth"
            className="px-8 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition font-semibold text-lg shadow-lg"
          >
            Login
          </a>

          <a
            href="/study"
            className="px-8 py-3 rounded-lg border border-purple-600 hover:bg-purple-700 hover:text-white transition font-semibold text-lg shadow-lg"
          >
            Study
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-900 text-gray-500 text-center py-4 border-t border-gray-800">
        © {new Date().getFullYear()} {appName}. All rights reserved.
      </footer>

      <style jsx>{`
        .blinking-cursor {
          animation: blink 1s steps(2, start) infinite;
          font-weight: 900;
          color: #d946ef; /* purple-500 */
          margin-left: 2px;
        }
        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          50.01%,
          100% {
            opacity: 0;
          }
        }

        @keyframes fadeSlideUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeSlideUp {
          animation: fadeSlideUp 0.8s ease forwards;
        }
      `}</style>
    </div>
  );
}