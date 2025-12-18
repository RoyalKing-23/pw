"use client";

import { useEffect, useState } from "react";
import HLSPlayer from "@/app/components/HLSPlayer";
import { toast } from "sonner";

export default function LivePage() {
  const [url, seturl] = useState<string | null>(null);
  const [signedUrl, setsignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null); // 👈 track error

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const batchId = params.get("batchId");
    const subjectId = params.get("SubjectId");
    const childId = params.get("ChildId");

    if (!batchId || !subjectId || !childId) {
      const err = "Missing required query parameters.";
      toast.error(err);
      setErrorMsg(err);

      setLoading(false);
      return;
    }

    const promise = toast.promise(
      fetch(
        `/api/get-video-url?batchId=${batchId}&subjectId=${subjectId}&childId=${childId}`
      ).then(async (res) => {
        // if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        if (!data.success) {
          throw new Error(
            data.message || "Failed to fetch video EROR_CODE_902"
          );
        }
        const videoData = data.data; // ✅ use the inner data object

        if (!videoData.url || !videoData.signedUrl) {
          throw new Error("Invalid video URL response from server");
        }

        seturl(videoData.url);
        setsignedUrl(videoData.signedUrl);
        return data;
      }),
      {
        loading: "Loading video link...",
        success: "Video link loaded!",
        error: (err) => {
          setErrorMsg(err.message || "Error loading video link");
          return err.message || "Error loading video link";
        },
      }
    );

    // unwrap returns a real Promise so you can use finally()
    promise.unwrap().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white">
        <span>Loading video...</span>
      </div>
    );
  }

  if (errorMsg || !url || !signedUrl) {
    return (
      <div className="text-red-500 text-center p-4">
        <p>{errorMsg || "Unknown error occurred."}</p>
      </div>
    );
  }

  return <HLSPlayer baseUrl={url} signedQuery={signedUrl} />;
}
