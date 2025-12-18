"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, InfoIcon, TriangleAlert, Shield, CheckCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function KeyGenerateClient({
  anon_id,
  batchId,
  iphash,
  useragent,
  token,
  batchName,
  batchImage,
  shortnerServers = [],
}: {
  anon_id: string;
  batchId: string;
  iphash: string;
  useragent: string;
  token: string;
  batchName: string;
  batchImage: string;
  shortnerServers?: Array<{ name: string; api_url: string; api_key: string; _id?: string; shortenedUrl?: string }>;
}) {
  const [serverInfo, setServerInfo] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/study/batches" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm text-white font-medium text-sm hover:bg-white/20 transition-all duration-200 border border-white/20 hover:border-white/30"
          >
            <ArrowLeft size={16} />
            <span>Back to Batches</span>
          </Link>
        </div>

        {/* Main Card */}
        <Card className="w-full bg-white/5 backdrop-blur-sm border border-white/10 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            {/* Batch Info */}
            <div className="text-center mb-8">
              {batchImage && (
                <div className="relative mb-6">
                  <img
                    src={batchImage}
                    alt={batchName}
                    className="w-full h-48 sm:h-64 object-cover rounded-xl shadow-lg border border-white/10 mx-auto max-w-md"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-xl"></div>
                </div>
              )}
              
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                {batchName || <span className="text-red-400">(Batch name not available)</span>}
              </h1>
              
              <div className="flex items-center justify-center gap-2 text-gray-300 mb-4">
                <Shield size={16} />
                <span className="text-sm">Verification Required</span>
              </div>

              <p className="text-gray-300 text-sm max-w-md mx-auto">
                Complete the verification process to access your selected batch content
              </p>
            </div>

            {/* Warning Alert */}
            <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <TriangleAlert className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-300 mb-2">Important Notice</h3>
                  <div className="text-sm text-amber-200 space-y-1">
                    <p>• You must verify your identity before accessing this batch</p>
                    <p>• For other batches, please go back and verify for your required batch</p>
                    <p>• Verification is a one-time process per batch</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Methods */}
            {shortnerServers.length > 0 ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white mb-2">Choose Verification Method</h3>
                  <p className="text-gray-300 text-sm">
                    Select one of the available verification methods below to proceed
                  </p>
                  <div className="flex justify-center mt-2">
                    <button
                      className="inline-flex items-center gap-1 text-purple-300 text-xs font-medium hover:underline focus:outline-none focus:underline transition-all"
                      onClick={() => router.push("/key-generate/guide")}
                      type="button"
                    >
                      <InfoIcon size={14} className="text-purple-400" />
                      How to open verification link?
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {shortnerServers.map((server, idx) => (
                    <button
                      key={server._id || server.name || idx}
                      className={`w-full group relative p-4 rounded-xl border transition-all duration-200 hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                        server.shortenedUrl 
                          ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-500/50 hover:border-purple-400/70 hover:from-purple-600/30 hover:to-blue-600/30' 
                          : 'bg-gray-800/50 border-gray-600/50 opacity-60 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (server.shortenedUrl) {
                          window.location.href = server.shortenedUrl;
                        }
                      }}
                      disabled={!server.shortenedUrl}
                      title={server.shortenedUrl ? `Verify via ${server.name}` : 'Verification method not available'}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          server.shortenedUrl 
                            ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white' 
                            : 'bg-gray-600 text-gray-400'
                        }`}>
                          {server.shortenedUrl ? (
                            <ExternalLink size={18} />
                          ) : (
                            <InfoIcon size={18} />
                          )}
                        </div>
                        
                        <div className="flex-1 text-left">
                          <h4 className={`font-semibold text-sm ${
                            server.shortenedUrl ? 'text-white' : 'text-gray-400'
                          }`}>
                            {server.name}
                          </h4>
                          <p className={`text-xs mt-1 ${
                            server.shortenedUrl ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {server.shortenedUrl ? 'Click to verify' : 'Currently unavailable'}
                          </p>
                        </div>

                        {server.shortenedUrl && (
                          <div className="flex-shrink-0">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                  <button
                    className="inline-flex items-center gap-1 text-purple-300 text-xs font-medium hover:underline focus:outline-none focus:underline transition-all"
                    onClick={() => router.push("/key-generate/guide")}
                    type="button"
                  >
                    <InfoIcon size={14} className="text-purple-400" />
                    How to open verification link?
                  </button>
                </div>
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/50 rounded-full flex items-center justify-center">
                  <InfoIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Verification Methods Available</h3>
                <p className="text-gray-300 text-sm">
                  Currently no verification methods are found. Please try again later or contact support.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 