"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ContactPage() {
  const router = useRouter();
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

  const appName = serverInfo?.webName || process.env.NEXT_PUBLIC_APP_NAME || "PW Quantum";
  const tg_channel = serverInfo?.tg_channel;
  const tg_username = serverInfo?.tg_username;
  const sidebarLogoUrl = serverInfo?.sidebarLogoUrl;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="w-full bg-gray-900 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3 cursor-pointer" onClick={() => router.push("/study")}>
          {sidebarLogoUrl && (
            <img src={sidebarLogoUrl} alt="Logo" className="w-10 h-10 rounded-lg shadow-md cursor-pointer" />
          )}
          <h1 className="text-2xl font-bold text-purple-400">{appName}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col justify-center items-center px-6 text-center p-6 animate-fadeSlideUp">
        <div className="bg-gray-800 bg-opacity-80 rounded-2xl shadow-2xl p-8 max-w-xl w-full border border-purple-700">
          <h2 className="text-4xl font-extrabold mb-4 text-emerald-400">Contact & Info</h2>
          <p className="mb-6 text-lg text-gray-200">
            <span className="font-semibold text-purple-300">{appName}</span> is your all-in-one study companion, designed to help you learn, code, and grow. Our platform offers curated study materials, interactive tools, and a supportive community to empower your learning journey.
          </p>
          <ul className="mb-8 text-left text-gray-300 space-y-2">
            <li><span className="font-semibold text-violet-400">Official Channel:</span> {tg_channel ? <a href={`https://t.me/${tg_channel.replace('@', '')}`} className="text-cyan-300 hover:underline" target="_blank" rel="noopener noreferrer">{tg_channel}</a> : <span className="italic text-gray-400">Not available</span>}</li>
            <li><span className="font-semibold text-violet-400">Contact Owner:</span> {tg_username ? <a href={`https://t.me/${tg_username.replace('@', '')}`} className="text-cyan-300 hover:underline" target="_blank" rel="noopener noreferrer">{tg_username}</a> : <span className="italic text-gray-400">Not available</span>}</li>
          </ul>
          <div className="flex flex-col items-center gap-4">
            <a
              href={tg_username ? `https://t.me/${tg_username.replace('@', '')}` : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-emerald-500 hover:from-purple-700 hover:to-emerald-600 transition font-semibold text-lg shadow-lg flex items-center gap-2 ${tg_username ? '' : 'pointer-events-none opacity-60'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 4.5l-9.615 15.364a.75.75 0 01-1.28-.03l-3.09-5.33-5.33-3.09a.75.75 0 01-.03-1.28L19.5 2.25a.75.75 0 011.28.03l.97 1.68a.75.75 0 01-.03 1.28z" />
              </svg>
              Contact Owner
            </a>
            <p className="text-xs text-gray-400 mt-2">For support, feedback, or partnership inquiries, reach out to the owner directly.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-gray-900 text-gray-500 text-center py-4 border-t border-gray-800">
        © {new Date().getFullYear()} {appName}. All rights reserved.
      </footer>

      <style jsx>{`
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