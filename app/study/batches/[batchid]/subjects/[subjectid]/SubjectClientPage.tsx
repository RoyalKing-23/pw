"use client";

import { useState, useEffect } from "react";
import { SubjectInfo } from "@/utils/api";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const batchId = params?.batchid as string;
  const subjectId = params?.subjectid as string;

  const [topics, setTopics] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [hasMore, setHasMore] = useState(true);

  const fetchTopics = async (pageToFetch: number) => {
    if (!batchId || !subjectId) return;

    if (pageToFetch === 1) {
      setLoadingInitial(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const res = await SubjectInfo(batchId, subjectId, pageToFetch);
      const newTopics = res.data || [];

      setTopics((prev) =>
        pageToFetch === 1 ? newTopics : [...prev, ...newTopics]
      );

      setHasMore(newTopics.length > 0);
    } catch (err: any) {
      console.error("Error fetching topics:", err);
      if (err.response?.status === 401) {
          toast.error("Unauthorized: Please login again.");
        } else {
          toast.error("Failed to load enrolled batches");
        }
      setError("Failed to fetch topics");
      if (pageToFetch === 1) setTopics([]);
      setHasMore(false);
    } finally {
      if (pageToFetch === 1) {
        setLoadingInitial(false);
      } else {
        setLoadingMore(false);
      }
    }
  };

  // Reset page to 1 when batch or subject changes
  useEffect(() => {
    setPage(1);
  }, [batchId, subjectId]);

  // Fetch topics when page changes
  useEffect(() => {
    fetchTopics(page);
  }, [page, batchId, subjectId]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="divshadow bg-background border rounded-lg p-6">
          <h3 className="text-2xl font-bold text-static-black max-md:text-xl max-sm:text-base mb-3">
            {GetSubjectName(subjectId || "unknown")}
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {loadingInitial ? (
              // Show 3 skeleton cards during initial load
              Array.from({ length: 3 }).map((_, idx) => (
                <article
                  key={`skeleton-${idx}`}
                  className="bg-background border rounded-xl p-4 divshadow animate-pulse"
                >
                  <div className="border-l-4 border-indigo-400 pl-3 rounded">
                    <div className="text-xl font-semibold text-foreground mb-2 p-3 bg-muted w-1/4 rounded-md"></div>
                    <div className="text-sm text-muted-foreground p-3 bg-muted w-1/2 rounded-md"></div>
                  </div>
                </article>
              ))
            ) : (
              <>
                {/* ALL CONTENTS card */}
                <article
                  className="bg-background border rounded-xl p-4 hover:shadow-md cursor-pointer divshadow"
                  onClick={() =>
                    router.push(
                      `/study/batches/${batchId}/subjects/${subjectId}/subject-topics/all`
                    )
                  }
                >
                  <div className="border-l-4 border-indigo-400 pl-3 rounded">
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      All Contents
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {topics.reduce((sum, t) => sum + (t.videos || 0), 0)}{" "}
                      Videos <span className="mx-1">|</span>{" "}
                      {topics.reduce((sum, t) => sum + (t.exercises || 0), 0)}{" "}
                      Exercises <span className="mx-1">|</span>{" "}
                      {topics.reduce((sum, t) => sum + (t.notes || 0), 0)} Notes
                    </p>
                  </div>
                </article>

                {/* Topic cards */}
                {topics.map((topic) => (
                  <article
                    key={topic._id}
                    className="bg-background border rounded-xl p-4 hover:shadow-md cursor-pointer divshadow"
                    onClick={() =>
                      router.push(
                        `/study/batches/${batchId}/subjects/${subjectId}/subject-topics/${topic.slug}`
                      )
                    }
                  >
                    <div className="border-l-4 border-indigo-400 pl-3 rounded">
                      <h2 className="text-lg font-semibold text-foreground mb-2">
                        {topic.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {topic.videos} Videos <span className="mx-1">|</span>{" "}
                        {topic.exercises} Exercises{" "}
                        <span className="mx-1">|</span> {topic.notes} Notes
                      </p>
                    </div>
                  </article>
                ))}
              </>
            )}
          </div>

          {/* Load More button */}
          {hasMore && !loadingInitial && (
            <div className="flex justify-center mt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-2 border rounded-md hover:bg-foreground/20 transition"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 text-red-600 font-semibold text-center">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GetSubjectName(slug?: string): string {
  if (!slug) return "Unknown";

  try {
    const decoded = decodeURIComponent(slug);
    const cleaned = decoded.replace(/-\d+$/, "");
    return cleaned
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  } catch (e) {
    console.error("Invalid slug:", slug);
    return "Unknown";
  }
} 