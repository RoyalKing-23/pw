"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import "../globals.css";
import { toast } from "sonner";

const YouTubePlayer = dynamic(() => import("@/app/components/YouTubePlayer"), {
  ssr: false,
});

const DashPlayer = dynamic(() => import("@/app/components/dashPlayer"), {
  ssr: false,
});

export default function HomePage() {
  const params = useSearchParams();

  const [videoType, setVideoType] = useState<"youtube" | "penpencilvdo" | null>(
    null
  );
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [clearKeys, setClearKeys] = useState<any>(null);
  const [signedUrlQuery, setSignedUrlQuery] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [Attachment, setAttachment] = useState<string | null>(null);

  // Params
  const batchId = params?.get("batchId") || "";
  const subjectId = params?.get("SubjectId") || "";
  const ContentId = params?.get("ContentId") || params?.get("ChildId") || "";

  useEffect(() => {
    if (!batchId || !subjectId || !ContentId) return;

    const fetchVideoData = async () => {
      setLoading(true);

      try {
        // Step 0: Get video type and URL
        const scheduleRes = await fetch(
          `/api/Schedule?BatchId=${batchId}&SubjectId=${subjectId}&ContentId=${ContentId}`
        );
        const scheduleData = await scheduleRes.json();

        if (!scheduleData?.success || !scheduleData?.data?.urlType) {
          throw new Error("Invalid Schedule API response");
        }

        const urlType = scheduleData.data.urlType;

        const homeworkIds = scheduleData?.data?.homeworkIds?.[0];
        // console.log("homeworkIds", homeworkIds);

        if (homeworkIds?.attachmentIds?.length > 0) {
          const attachment = homeworkIds.attachmentIds[0];
          // console.log("Attachment:", attachment);

          if (attachment?.baseUrl && attachment?.key) {
            setAttachment(attachment);
          }
        }

        const url = scheduleData.data.url;

        if (urlType === "youtube") {
          setVideoType("youtube");
          setVideoUrl(url);
          return;
        }

        if (urlType === "penpencilvdo") {
          setVideoType("penpencilvdo");

          // Step 1: Get Signed URL
          const penRes = await fetch(
            `/api/get-video-url?batchId=${batchId}&subjectId=${subjectId}&childId=${ContentId}`
          );
          const penData = await penRes.json();

          const finalUrl = penData?.data?.url;
          const signedQuery = penData?.data?.signedUrl;

          if (!finalUrl || !signedQuery) {
            toast.error("This Batch is unavailable. Please contact admin to add this batch.");
            return;
          }

          const fullMPDUrl = `${finalUrl}${signedQuery}`;

          // Step 2: Fetch MPD and extract default_KID
          const mpdRes = await fetch(fullMPDUrl);
          const mpdText = await mpdRes.text();

          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(mpdText, "application/xml");

          const kidNode = xmlDoc.querySelector(
            'ContentProtection[schemeIdUri="urn:mpeg:dash:mp4protection:2011"]'
          );
          let defaultKID = kidNode?.getAttribute("cenc:default_KID");

          if (!defaultKID) {
            throw new Error("DEFAULT_KID not found in MPD");
          }

          // Normalize the KID
          defaultKID = defaultKID.replace(/-/g, "").toLowerCase();

          // Step 3: Fetch ClearKeys using the default_KID
          const otpRes = await fetch(`/api/get-otp?kid=${defaultKID}`);
          const otpData = await otpRes.json();

          if (!otpData?.clearKeys) {
            throw new Error("Missing clearKeys in OTP response");
          }

          // Step 4: Set state with everything
          setVideoUrl(finalUrl);
          setSignedUrlQuery(signedQuery);
          setClearKeys(otpData?.clearKeys);
          setVideoType("penpencilvdo");
        } else {
          setVideoType(null);
        }
      } catch (err) {
        console.error("Video setup failed:", err);
        let message = "Unknown error";
        if (typeof err === "string") message = err;
        else if (err && typeof err === "object" && "message" in err && typeof (err as any).message === "string") message = (err as any).message;
        toast.error(`${message} - Try refreshing the page!`);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [batchId, subjectId, ContentId]);
  // ✅ Auto-rotate to landscape for all video types
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;

      if (isFullscreen && (screen.orientation && typeof (screen.orientation as any).lock === "function")) {
        (screen.orientation as any).lock("landscape").catch((err: unknown) => {
          console.warn("Orientation lock failed:", err);
        });
      } else if (screen.orientation?.unlock) {
        screen.orientation.unlock?.();
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []); // ✅ runs globally, not just for penpencilvdo

  return (
    <div className="h-[100%] md:overflow-auto lg:overflow-hidden select-none">
      <div className="relative" style={{ height: "100%" }}>
        {loading && <div className="text-center p-4">Loading video...</div>}

        {!loading && videoType === "youtube" && videoUrl && (
          <YouTubePlayer videoId={extractYouTubeVideoId(videoUrl)} />
        )}

        {!loading && videoType === "penpencilvdo" && videoUrl && clearKeys ? (
          <DashPlayer
            src={videoUrl}
            type="dash"
            Attachment={Attachment || undefined}
            signedUrlQuery={signedUrlQuery}
            drmConfig={{ clearKeys }}
          />
        ) : !loading && videoType === null ? (
          <div className="text-center p-4 text-red-600">
            <p className="mb-2">This Batch is unavailable. Please contact admin to add this batch.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Reload Page
            </button>
          </div>
        ) : null}

      </div>
    </div>
  );
}

// Extract YouTube video ID helper
function extractYouTubeVideoId(url: string): string {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname === "youtu.be") {
      return parsedUrl.pathname.slice(1);
    }

    const vParam = parsedUrl.searchParams.get("v");
    if (vParam && vParam.length === 11) {
      return vParam;
    }

    const match = parsedUrl.pathname.match(
      /\/(embed|v|shorts)\/([a-zA-Z0-9_-]{11})/
    );
    if (match && match[2]) {
      return match[2];
    }

    return "";
  } catch {
    return "";
  }
}
