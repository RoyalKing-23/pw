"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "../globals.css";
import { QuantumParticles } from "@/app/components/QuantumParticles";
import { LucideTriangleAlert, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

const appName = process.env.NEXT_PUBLIC_APP_NAME;

export default function Login() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(15); // 15 seconds countdown !! --> SATISH
  const [canResend, setCanResend] = useState(false);
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [verified, setVerified] = useState(false);
  const router = useRouter();

  // Get server info from global window object
  useEffect(() => {
    const globalServerInfo = (window as any).__SERVER_INFO__;
    if (globalServerInfo) {
      setServerInfo(globalServerInfo);
    } else {
      // Fallback: fetch server info if not available globally
      async function fetchServerInfo() {
        try {
          const res = await fetch("/api/auth/serverInfo");
          if (!res.ok) throw new Error("Failed to fetch server info");
          const data = await res.json();
          setServerInfo(data);
        } catch (err) {
          setError("Could not load server info");
        }
      }
      fetchServerInfo();
    }
  }, []);
  const isDirectLogin: boolean = serverInfo?.isDirectLoginOpen ?? false;
  const botUsername = serverInfo?.tg_bot;

  const startResendCountdown = () => {
    setResendTimer(15);
    setCanResend(false);

    let timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (step === "otp") {
      startResendCountdown();
    }
  }, [step]);

  const resendOtp = async (smsType: number) => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/auth/resend-otp?smsType=${smsType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to resend OTP");
        toast.error(data.message || "Failed to resend OTP");
        return;
      }

      // Restart countdown after resend
      startResendCountdown();
    } catch (err) {
      console.error(err);
      setError("An error occurred while resending OTP.");
      toast.error("An error occurred while resending OTP.");
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !/^[6-9][0-9]{9}$/.test(phone)) {
      setError("Please enter a valid 10-digit mobile number.");
      toast.error("Please enter a valid 10-digit mobile number.");

      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: phone }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "OTP request failed");
        toast.error(data.message || "OTP request failed");

        return;
      }
      if(data.success){
        toast.success(data.message || "Otp Sent!");

      }
      setStep("otp");
    } catch (err: any) {
      console.error(err);
      setError("An error occurred while sending OTP.");
      toast.error("An error occurred while sending OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError("Please enter the OTP.");
      toast.error("Please enter the OTP.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: phone, otp }),
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "OTP verification failed");
        toast.error(data.message || "OTP verification failed");
        return;
      }
      if(data.success){
        toast.success(data.message || "Otp Verified!");

      }
      // Save user data locally — example using localStorage
      if (data.user) {
        localStorage.setItem("USER_DATA", JSON.stringify(data.user));
      }
      setVerified(true);
      setTimeout(() => {
        router.replace("/study");
      }, 800); // Short delay to show 'Verified' state
    } catch (err: any) {
      setError("An error occurred during OTP verification.");
      toast.error("An error occurred during OTP verification.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#0f0f23] px-4 overflow-hidden">
      <QuantumParticles />

      <form
        onSubmit={step === "phone" ? requestOtp : verifyOtp}
        className="w-full max-w-sm bg-[#1f1f2e] text-white rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.05)] p-6 md:p-8 space-y-6 z-10 border border-white/10 backdrop-blur-sm"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {step === "phone" ? "Sign In" : "Verify OTP"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {step === "phone"
              ? "Enter your mobile number to continue"
              : `OTP sent to +91-${phone}`}
          </p>
        </div>
        <div className="space-y-4">
          {step === "phone" ? (
            <>
              <div className="flex items-center bg-[#2a2a3a] border border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 transition">
                <span className="px-4 py-3 text-gray-400 font-medium">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setPhone(val);
                    if (error) setError("");
                  }}
                  className="flex-1 px-4 py-3 bg-transparent text-white placeholder-gray-500 outline-none"
                  placeholder="Mobile Number"
                />
              </div>
              <label className="flex items-center text-sm text-gray-400 space-x-2">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 text-purple-500 bg-black border-gray-600 rounded accent-purple-600"
                />
                <span>I’m not a robot</span>
              </label>
            </>
          ) : (
            <>
              <div className="flex items-center bg-[#2a2a3a] border border-gray-700 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-purple-500 transition">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setOtp(val);
                    if (error) setError("");
                  }}
                  className="flex-1 px-4 py-3 bg-transparent text-white placeholder-gray-500 outline-none text-center"
                  placeholder="Enter OTP"
                />
              </div>
              {canResend ? (
                <div className="flex flex-wrap items-center space-y-2 text-sm text-gray-400">
                  <p className="text-gray-400">Didn't get the OTP?</p>
                  <div className="flex flex-col text-center gap-2 item-center w-full justify-center">
                    <button
                      type="button"
                      onClick={() => resendOtp(0)}
                      className="text-purple-400 px-3 py-1"
                    >
                      Resend via SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => resendOtp(1)}
                      className="text-green-400 px-3 py-1 "
                    >
                      Send on WhatsApp
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 text-center">
                  You can resend OTP in {resendTimer}s
                </p>
              )}
            </>
          )}

          {error && <p className="text-sm text-red-400 -mt-2">{error}</p>}

          <button
            disabled={loading || verified}
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 transition text-white font-semibold py-3 rounded-lg"
          >
            {loading
              ? "Please wait..."
              : verified
              ? "Verified"
              : step === "phone"
              ? "Send OTP"
              : "Verify OTP"}
          </button>
        </div>
        <p className="text-xs text-center text-gray-500">
          Made with ❤️ by{" "}
          <span className="font-semibold text-purple-400">{appName}</span>
        </p>
        {/* Bot Authorization Info */}
        {!isDirectLogin &&
        (
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/40 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-400 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-300 mb-2 inline-flex">
                  <LucideTriangleAlert
                    size={17}
                    className="mr-2"
                    color="#bfbd4e"
                  />{" "}
                  Authorization Required
                </h3>
                <p className="text-xs text-blue-200 leading-relaxed mb-3">
                  Before logging in, you need to authorize yourself with our bot
                  first.
                </p>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-blue-300">Bot Username:</span>
                  <a
                    href={`https://telegram.me/${botUsername?.replace(
                      "@",
                      ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-blue-100 bg-blue-900/50 px-2 py-1 rounded text-xs hover:bg-blue-800/70 transition-colors"
                  >
                    {botUsername}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )
      }
      </form>
    </div>
  );
}
