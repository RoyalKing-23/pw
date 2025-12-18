"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock5, DownloadIcon, Play, FileText } from "lucide-react";
import { TopicInfo, GetPdf } from "@/utils/api";
import { toast } from "sonner";

import { VideoComponent } from "@/app/components/VideoComponent";

const TABS = [
  { label: "Lectures", value: "videos" },
  { label: "Notes", value: "notes" },
  { label: "DPP PDF", value: "DppNotes" },
  { label: "DPP Video", value: "DppVideos" },
];

export default function BatchContentPage() {
  const params = useParams();
  const router = useRouter();

  const batchId = params?.batchid as string;
  const subjectId = params?.subjectid as string;
  const topicId = params?.topicid as string;

  const defaultTab = "videos";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [topics, setTopics] = useState<any[]>([]); // Define state to store topics
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false); // for first page load or tab change
  const [loadingMore, setLoadingMore] = useState(false); // for load more button
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Reset page/topics when tab changes
  useEffect(() => {
    setPage(1);
    setTopics([]);
    setHasMore(true);
  }, [activeTab, batchId, subjectId, topicId]);

  const handleOpen = async (attachment: any, pdfId: any) => {
    try {
      if (attachment?.key && attachment?.baseUrl) {
        const fullUrl = attachment.baseUrl + attachment.key;

        try {
          const headRes = await fetch(fullUrl, { method: "HEAD" });

          if (headRes.ok) {
            window.open(fullUrl, "_blank");
            return;
          }
        } catch (err) {
          console.warn("HEAD check failed for attachment:", err);
        }
      }

      // Use toast.promise to handle loading/success/error UI feedback
      await toast.promise(
        (async () => {
          const result = await GetPdf(batchId, subjectId, pdfId);

          const key = result?.data?.key;
          const baseUrl = result?.data?.baseUrl;

          if (key && baseUrl) {
            const fullUrl = baseUrl + key;

            const headRes = await fetch(fullUrl, { method: "HEAD" });

            if (headRes.ok) {
              window.open(fullUrl, "_blank");
            } else {
              throw new Error("PDF exists but couldn't be opened.");
            }
          } else {
            throw new Error("PDF not available or could not be generated.");
          }
        })(),
        {
          loading: "Fetching PDF...",
          success: "PDF opened successfully!",
          error: (err) => err?.message || "Error opening PDF.",
        }
      );
    } catch (error: any) {
      console.error("handleOpen error:", error);
      toast.error(
        error.message || "Something went wrong while opening the PDF."
      );
    }
  };

  useEffect(() => {
    if (!batchId || !subjectId || !topicId) return;

    const fetchTopics = async () => {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await TopicInfo(
          batchId,
          subjectId,
          topicId,
          activeTab,
          page
        );

        const newTopics = response.data || [];

        setTopics((prev) => (page === 1 ? newTopics : [...prev, ...newTopics]));
        setHasMore(newTopics.length > 0);
      } catch (err: any) {
        console.error("Error fetching topics:", err);
        if (err.response?.status === 401) {
          toast.error("Unauthorized: Please login again.");
        } else {
          toast.error("Failed to load enrolled batches");
        }
        if (page === 1) setTopics([]);
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    };

    fetchTopics();
  }, [batchId, subjectId, topicId, activeTab, page]);

  function getDisplayName(slug: string): string {
    if (!slug) return "Unknown";

    try {
      const decoded = decodeURIComponent(slug);

      const cleaned = decoded
        .replace(/-+\d+$/, "") // Remove trailing dashes + numbers like ----077165
        .replace(/-+/g, " ") // Replace multiple dashes with space
        .trim();

      // Capitalize the first letter of each word
      const capitalized = cleaned
        .split(" ") // Split the string by spaces
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ) // Capitalize first letter of each word
        .join(" "); // Join the words back together with spaces

      return capitalized;
    } catch {
      return "Unknown";
    }
  }

  // Mouse event handlers for dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const distance = e.clientX - startX;
    e.currentTarget.scrollLeft = scrollLeft - distance;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="divshadow bg-background border rounded-lg p-6">
          <h3 className="text-2xl font-bold text-static-black max-md:text-xl max-sm:text-base mb-4">
            {topicId === "all" ? "All Content" : getDisplayName(topicId)}
          </h3>
          <div className="p-1">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList
                className="w-auto h-auto lg:w-fit block overflow-x-auto overflow-y-hidden whitespace-nowrap text-center"
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="px-5 py-2 my-1 text-md text-muted-foreground data-[state=active]:bg-[#4c45f7] data-[state=active]:text-white data-[state=active]:font-medium rounded-md transition-all whitespace-nowrap"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {TABS.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                  <div className="flex flex-col">
                    <div
                      className="
          mt-5
          flex flex-col gap-6
          sm:grid sm:grid-cols-1 sm:gap-6
          md:grid-cols-2
          md:gap-5
          lg:grid-cols-3 
          lg:gap-5
          xl:grid-cols-4
        "
                    >
                      {page === 1 && loading ? (
                        // show 6 placeholders
                        Array.from({ length: 6 }).map((_, index) => {
                          switch (tab.value) {
                            case "videos":
                            case "DppVideos":
                              return (
                                <VideoComponent
                                  key={index}
                                  isPlaceholder={true}
                                />
                              );

                            case "notes":
                            case "DppNotes":
                              return (
                                <article
                                  key={index}
                                  className="bg-background border rounded-lg shadow-md animate-pulse h-40 flex flex-col justify-between"
                                >
                                  <div className="p-4 space-y-2">
                                    <div className="bg-muted h-4 w-3/4 rounded"></div>
                                    <div className="bg-muted h-4 w-1/2 rounded"></div>
                                  </div>
                                  <div className="border-t p-3 flex justify-between">
                                    <div className="bg-muted h-6 w-6 rounded"></div>
                                    <div className="bg-muted h-6 w-6 rounded"></div>
                                  </div>
                                </article>
                              );
                            default:
                              return null;
                          }
                        })
                      ) : topics.length === 0 ? (
                        <article className="cursor-pointer py-2 rounded-sm">
                          <Image
                            src="/assets/img/coming-soon.png"
                            width={1200}
                            height={120}
                            className="_coming-soon_rounq_1 my-5 object-contain"
                            alt="Coming Soon"
                          />
                        </article>
                      ) : (
                        topics.map((topic, idx) => {
                          switch (tab.value) {
                            case "videos":
                            case "DppVideos":
                              return (
                                <VideoComponent
                                  key={topic._id}
                                  onClick={() => {
                                    console.log("Video clicked!");
                                    router.push(
                                      `/watch?batchId=${batchId}&SubjectId=${subjectId}&ChildId=${topic._id
                                      }&Type=${topic.urlType}&VideoUrl=${topic.videoDetails.videoUrl ??
                                      topic.videoDetails.embedCode
                                      }&isLocked=${topic.isLocked}`
                                    );
                                  }}
                                  thumbnail={
                                    topic.videoDetails?.image ||
                                    "/assets/img/video-placeholder.svg"
                                  }
                                  title={
                                    topic.topic ||
                                    topic.videoDetails?.name ||
                                    "Lecture On Above Topic"
                                  }
                                  duration={
                                    topic.videoDetails?.duration || "00:00:00"
                                  }
                                  date={new Date(topic.date).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    }
                                  )}
                                  alt={
                                    topic.videoDetails?.name ||
                                    "Lecture Thumbnail"
                                  }
                                />
                              );

                            case "notes":
                            case "DppNotes":
                              return (
                                <article
                                  key={topic._id}
                                  onClick={() => {
                                    const attachment =
                                      topic.homeworkIds?.[0]
                                        ?.attachmentIds?.[0];
                                    if (attachment) {
                                      handleOpen(attachment, topic._id);
                                    } else {
                                      alert("No attachment found.");
                                    }
                                  }}
                                  className="bg-background flex flex-col justify-between border overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                                >
                                  <div className="cursor-pointer">
                                    <div className="p-4 pb-0 text-sm font-semibold text-foreground mb-2 line-clamp-2">
                                      {topic.homeworkIds?.[0]?.name ||
                                        topic.homeworkIds?.[0]?.topic ||
                                        "Untitled Note"}
                                    </div>
                                    <div className="px-4 text-xs text-muted-foreground">
                                      Uploaded on{" "}
                                      {new Date(topic.date).toLocaleDateString(
                                        "en-IN",
                                        {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        }
                                      )}
                                    </div>
                                  </div>

                                  <div className="shadow-md mt-3 p-3 border-t flex flex-wrap items-center justify-between">
                                    <div className="cursor-pointer text-indigo-600 border border-indigo-600 dark:text-foreground dark:border-foreground rounded-md p-1">
                                      <FileText size={20} />
                                    </div>
                                    <div
                                      className="cursor-pointer border
                                      text-background dark:border-foreground bg-foreground
                                     rounded-md p-1
                                     "
                                    >
                                      <DownloadIcon size={20} />
                                    </div>
                                  </div>
                                </article>
                              );
                            default:
                              return null;
                          }
                        })
                      )}
                    </div>

                    {/* Load More Button */}
                    {hasMore && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={loadMore}
                          disabled={loadingMore}
                          className="px-6 py-2 border rounded-md hover:bg-indigo-600 hover:text-white transition disabled:opacity-50"
                        >
                          {loadingMore ? "Loading..." : "Load More"}
                        </button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
