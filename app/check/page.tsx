"use client";

import React from "react";
import { CheckTGStatus } from "@/utils/api";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const handleConnectTelegram = async () => {
    // Use NEXT_PUBLIC_ prefix for client-side environment variable
    const TELEGRAM_BOT_USERNAME =
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME!;
    if (!TELEGRAM_BOT_USERNAME) {
      toast.error("Contact Admin: Error Code: EROR_BOT_506");
      return;
    }

    let userId: string | null = null;

    try {
      // Try to get from localStorage
      const storedData = localStorage.getItem("USER_DATA");
      if (storedData) {
        const parsed = JSON.parse(storedData);
        userId = parsed?.userId ?? null;
      }

      // If not found, fetch from API
      if (!userId) {
        const res = await fetch("/api/AboutMe");
        const data = await res.json();
        if (res.ok && data?.user?.userId) {
          userId = data.user.userId;
        }
      }

      if (!userId) {
        toast.error("Contact Admin: EROR_CODE: USER_ID_NT_FOUND_507");
        return;
      }

      // Open Telegram verification link
      const telegramUrl = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=verify_${userId}`;
      window.open(telegramUrl, "_blank");
    } catch (error: any) {
      toast.error("Failed to connect Telegram. Please try again.");
      console.error("Telegram connection error:", error);
    }
  };

  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);

    try {
      const res = await CheckTGStatus();

      if (res.success) {
        toast.success("✅ Telegram is connected!");
        setTimeout(() => {
          router.replace("/study");
        }, 500);
      } else {
        toast.warning("❌ Telegram is not connected yet.");
      }
    } catch (error) {
      console.error("Verification failed:", error);
      toast.error("⚠️ Something went wrong while verifying.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 px-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-md text-center shadow-2xl space-y-6">
        <img
          src="https://telegram.org/img/t_logo.png"
          alt="Telegram Logo"
          className="w-20 h-20 mx-auto mb-2 rounded-full bg-white/20 p-2"
        />

        <h1 className="text-white text-2xl font-semibold">
          🚫 Not Connected with Telegram
        </h1>

        <p className="text-gray-200 text-sm">
          It looks like your account isn’t linked to Telegram.
          <br />
          👉 Please connect by tapping the button below.
        </p>

        <button
          onClick={handleConnectTelegram}
          className="bg-blue-500 hover:bg-blue-600 transition-all text-white font-semibold px-6 py-3 rounded-full shadow-lg"
        >
          🔗 Connect via Telegram
        </button>

        <hr className="border-white/20" />

        <p className="text-gray-300 text-sm">
          ✅ Once connected, click the verify button.
        </p>

        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className={`bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-full shadow-lg transition-all ${
            isVerifying ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isVerifying ? "Verifying..." : "🔐 Verify"}
        </button>
      </div>
    </main>
  );
}
