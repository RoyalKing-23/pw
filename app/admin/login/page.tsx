"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Admin access protection is handled in middleware.
    // No need to check token client-side anymore.
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include", // ✅ Important: to allow cookie to be set
      });

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("Login successful! Please wait redirecting to dashboard...");
        router.push("/admin/dashboard");
      } else {
        const errorMsg = data.message || "Login failed";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMsg = "Network error. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-sm p-8 md:p-10 rounded-xl shadow-md border border-gray-200 bg-white animate-fadeIn">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 mb-2" />
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin Login</h1>
          <span className="text-gray-500 text-sm">Sign in to your admin dashboard</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label htmlFor="username" className="text-gray-700">Username</Label>
            <Input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required className="mt-1 bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400" placeholder="Enter your username" autoFocus />
          </div>
          <div className="relative">
            <Label htmlFor="password" className="text-gray-700">Password</Label>
            <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-indigo-500 placeholder:text-gray-400 pr-10" placeholder="Enter your password" />
            <button type="button" tabIndex={-1} className="absolute right-3 top-9 text-gray-400 hover:text-gray-700 transition" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="flex justify-between items-center">
            <a href="#" className="text-xs text-gray-400 hover:text-indigo-500 transition underline underline-offset-2">Forgot password?</a>
            <div />
          </div>
          {error && <div className="text-red-500 text-sm text-center animate-fadeIn">{error}</div>}
          <Button 
            type="submit" 
            className="w-full py-3 text-base font-semibold text-white rounded-lg transition-all duration-200 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60 touch-manipulation" 
            disabled={loading}
            onClick={(e) => {
              // Ensure the button click is handled properly on mobile
              if (loading) {
                e.preventDefault();
                return;
              }
            }}
          >
            {loading && <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </Card>
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.7s cubic-bezier(0.23, 1, 0.32, 1) both;
        }
        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(32px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
} 