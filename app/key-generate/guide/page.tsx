"use client";
import React from "react";
import { ArrowLeft, CheckCircle, InfoIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const YouTubePlayer = dynamic(() => import("@/app/components/YouTubePlayer"), { ssr: false });

export default function KeyGenerateGuidePage() {
  const router = useRouter();
  const videoUrl = "https://youtu.be/G0CN5s8zD8Q?si=-kyv-z1EudheKRsB";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg border border-white/10 shadow-2xl rounded-2xl p-0 sm:p-0 flex flex-col">
        <div className="flex items-center gap-2 p-4 border-b border-white/10">
          <button
            className="inline-flex items-center gap-1 text-purple-300 text-xs font-medium hover:underline focus:outline-none focus:underline transition-all"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft size={16} className="text-purple-400" />
            Back
          </button>
          <div className="flex-1"></div>
          <InfoIcon size={18} className="text-purple-400" />
        </div>
        <div className="p-6 sm:p-8 flex flex-col gap-6">
          <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-1">How to Open the Verification Link</h1>
          <p className="text-gray-300 text-center text-sm mb-2">
            Watch this quick video or follow the steps below to complete your verification smoothly.
          </p>
          <div className="w-full aspect-video rounded-lg overflow-hidden shadow border border-white/10 bg-black mb-4">
            <YouTubePlayer videoId={videoUrl} />
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-white mb-1">Step-by-Step Guide</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-gray-200 text-sm">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                Click your preferred verification method button.
              </li>
              <li className="flex items-start gap-2 text-gray-200 text-sm">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                Allow your browser to open the link in a new tab or window if prompted.
              </li>
              <li className="flex items-start gap-2 text-gray-200 text-sm">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                Follow the on-screen instructions in the new tab to complete verification.
              </li>
              <li className="flex items-start gap-2 text-gray-200 text-sm">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                If you encounter issues, ensure pop-ups are enabled for this site.
              </li>
              <li className="flex items-start gap-2 text-gray-200 text-sm">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                After successful verification, return to the batch page to access your content.
              </li>
            </ul>
          </div>
          <div className="mt-4 text-center">
            <span className="text-gray-400 text-xs">Need more help? Contact support or refer to the FAQ.</span>
          </div>
        </div>
      </div>
    </div>
  );
} 