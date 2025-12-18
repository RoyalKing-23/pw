"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { BatchInfo } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { BellDot, MessagesSquare, BookmarkPlus } from "lucide-react";
import he from "he";
import BatchCard from "@/app/components/BatchCard";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter(); //
  const batchId = params?.batchid as string;
  const [hasMore, setHasMore] = useState(true);
  const pathname = usePathname();
  const [pageView, setPageView] = useState<"batch" | "announcement">("batch");
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(
    null
  );
  const [announcementPage, setAnnouncementPage] = useState<number>(1);

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"description" | "classes">(
    "classes"
  );
  const [batchInternalId, setBatchInternalId] = useState<string | null>(null); // 👈 additional state

  const [batchDetails, setBatchDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();

  useEffect(() => {
    const toastMsg = searchParams?.get("toast");
    if (toastMsg) {
      toast.success(decodeURIComponent(toastMsg));
    }
  }, [searchParams, toast]);

  const fetchAnnouncements = async () => {
    if (pageView !== "announcement" || !batchInternalId) return;

    setAnnouncementLoading(true);
    setAnnouncementError(null);

    try {
      const res = await BatchInfo(
        batchInternalId,
        "announcement",
        announcementPage
      );
      const newAnnouncements = res.data || [];

      // If loading page 1 → replace; else → append
      setAnnouncements((prev) =>
        announcementPage === 1
          ? newAnnouncements
          : [...prev, ...newAnnouncements]
      );

      // ✅ If empty array returned → no more pages
      if (newAnnouncements.length === 0) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
          toast.error("Unauthorized: Please login again.");
        } else {
          toast.error("Failed to load enrolled batches");
        }
      setAnnouncementError(
        err?.response?.data?.message || "Failed to fetch announcements"
      );
      // Optional: stop trying further pages on error
      setHasMore(false);
    } finally {
      setAnnouncementLoading(false);
    }
  };
  useEffect(() => {
    if (pageView === "announcement") {
      setAnnouncementPage(1); // Reset page when switching tab
      setHasMore(true); // Reset hasMore too
    }
  }, [pageView]);

  useEffect(() => {
    fetchAnnouncements();
  }, [pageView, batchId, batchInternalId, announcementPage]);

  useEffect(() => {
    const fetchBatchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await BatchInfo(batchId, "details");

        const data = res.data;
        setBatchDetails(data);
        // ✅ Set internal ID or any other property you want
        if (data?._id) {
          setBatchInternalId(data._id);
        }
      } catch (error: any) {
        setError(
          error?.response?.data?.message || "Error fetching batch details"
        );
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (batchId) fetchBatchDetails();
  }, [batchId]);

  if (pageView === "announcement") {
    return (
      <>
        {previewSrc && (
          <div
            className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center"
            onClick={() => setPreviewSrc(null)}
          >
            <div className="relative max-w-3xl w-full p-4 dark:border bg-foreground rounded divshadow">
              {/* <p className="text-white mb-2">Preview src: {previewSrc}</p> */}
              <img
                src={previewSrc}
                alt="Preview"
                className="rounded-lg max-h-[80vh] mx-auto"
              />
            </div>
          </div>
        )}
        <div className="p-5">
          <div className="container mx-auto px-0 py-6">
            <div className="divshadow bg-background border rounded-lg p-6">
              <div className="flex flex-wrap justify-between items-center mb-4">
                <Button
                  onClick={() => setPageView("batch")}
                  className="sm:p-1 sm:h-min"
                >
                  ← Back to Batch
                </Button>
                <h3 className="text-xl font-bold">📢 Announcements</h3>
                {/* <span></span> */}
              </div>
              <div className="">
                {announcementLoading && announcementPage === 1 ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-3">
                      <BatchCard isPlaceholder />
                      <BatchCard isPlaceholder />
                      <BatchCard isPlaceholder />
                    </div>
                  </>
                ) : announcements.length ? (
                  <>
                    <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2 lg:grid-cols-3">
                      {announcements.map((item, idx) => (
                        <div
                          key={idx}
                          className="no-scrollbar flex flex-col gap-4 
                    overflow-y-scroll justify-between
                     bg-background border p-4 divshadow max-h-96 rounded-lg"
                        >
                          {/* Header */}
                          <div className="flex items-start gap-4">
                            <img
                              className="h-11 w-11"
                              src="/assets/img/defaultSubject.svg"
                              alt="PW Logo"
                            />
                            <div>
                              <span className="mt-3 text-sm font-bold">
                                PW Team
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {new Date(item.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="text-sm space-y-2">
                            <p className="break-words whitespace-pre-wrap">
                              {item.announcement}
                            </p>
                          </div>

                          {/* Optional: Image */}
                          {item.attachment && (
                            <div
                              onClick={() => {
                                const url =
                                  item.attachment.baseUrl + item.attachment.key;
                                console.log("Preview URL:", url);
                                setPreviewSrc(url);
                              }}
                              className="cursor-pointer"
                            >
                              <div className="relative aspect-video w-full">
                                <Image
                                  src={
                                    item.attachment.baseUrl +
                                    item.attachment.key
                                  }
                                  alt="Announcement visual"
                                  className="object-contain rounded"
                                  fill
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Load More Button */}
                    {hasMore && (
                      <div className="flex justify-center mt-4">
                        <Button
                          variant="outline"
                          onClick={() =>
                            setAnnouncementPage((prev) => prev + 1)
                          }
                          disabled={announcementLoading}
                        >
                          {announcementLoading ? "Loading..." : "Load More"}
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="p-3 border rounded-md text-center">
                      <p className="p-4">No announcements available.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (pageView === "batch") {
    return (
      <>
        <div className="p-5">
          {/* Header */}
          <div className="bg-background border rounded-[20px_20px_0_0]">
            <div className="rounded-[20px_20px_0_0] overflow-hidden">
              <div className="bg-[url(/assets/img/descriptionHeader.svg)] bg-no-repeat bg-cover bg-center container mx-auto px-4 py-6">
                {batchDetails ? (
                  <h1 className="text-2xl font-bold text-white p-2">
                    {batchDetails.name}
                  </h1>
                ) : (
                  <div className="h-8 w-64 bg-muted-foreground/30 animate-pulse rounded p-2" />
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex flex-wrap items-center w-auto justify-between px-0 divshadow">
              <div className="flex overflow-x-auto mx-3 gap-5">
                <button
                  onClick={() => setActiveTab("description")}
                  className={`px-1 text-foreground py-3 text-xs w-auto font-medium transition-all border-b-4 ${
                    activeTab === "description"
                      ? "border-[#7567ee] text-[#5a4bda] rounded dark:text-[#29ff94] dark:border-[#3dc280]"
                      : "border-transparent hover:text-[#7567ee] dark:hover:text-[#29ff94]"
                  }`}
                >
                  📘 Description
                </button>

                <button
                  onClick={() => setActiveTab("classes")}
                  className={`px-1 text-foreground py-3 text-xs w-auto font-medium transition-all border-b-4 ${
                    activeTab === "classes"
                      ? "border-[#7567ee] text-[#5a4bda] rounded dark:text-[#29ff94] dark:border-[#3dc280]"
                      : "border-transparent hover:text-[#7567ee] dark:hover:text-[#29ff94]"
                  }`}
                >
                  🎁 All Classes
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 text-foreground rounded-lg mx-5">
                <Button
                  variant="outline"
                  className="gap-2 px-3 py-4 text-[smaller] h-0"
                >
                  <MessagesSquare className="w-4 h-4" />
                  Share Batch
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPageView("announcement")}
                  className="gap-2 px-3 py-4 text-[smaller] h-0"
                >
                  <svg
                    width="24"
                    className="!w-6 !h-6 dark:!stroke-white stroke-black"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14.1426 15.8113C15.5636 15.6427 16.9337 15.3087 18.2333 14.8289C17.1557 13.6328 16.4999 12.0492 16.4999 10.3125V9.78689C16.5 9.7746 16.5 9.76231 16.5 9.75C16.5 7.26472 14.4853 5.25 12 5.25C9.51472 5.25 7.5 7.26472 7.5 9.75L7.49985 10.3125C7.49985 12.0492 6.84396 13.6328 5.76636 14.8289C7.06605 15.3087 8.43632 15.6428 9.85735 15.8113M14.1426 15.8113C13.44 15.8946 12.7249 15.9375 11.9999 15.9375C11.2749 15.9375 10.5599 15.8946 9.85735 15.8113M14.1426 15.8113C14.2124 16.0283 14.25 16.2598 14.25 16.5C14.25 17.7426 13.2426 18.75 12 18.75C10.7574 18.75 9.75 17.7426 9.75 16.5C9.75 16.2598 9.78764 16.0284 9.85735 15.8113"
                      stroke=""
                      strokeWidth="1.325"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                    <circle
                      cx="16.125"
                      cy="7.125"
                      r="3.1875"
                      fill="#BF2734"
                      stroke="white"
                      strokeWidth="1.125"
                    ></circle>
                  </svg>
                  Announcement
                </Button>
              </div>
            </div>
          </div>

          {activeTab === "description" && (
            <div className="container mx-auto px-0 py-6">
              {/* Description Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* This Batch Includes */}
                  <div className="divshadow bg-background border rounded-lg p-6 !text-foreground">
                    <h2 className="text-xl font-semibold mb-4">
                      This Batch Includes
                    </h2>
                    {/* Display the description */}
                    {batchDetails?.shortDescription ? (
                      <div
                      className="text-foreground !dark:text-white"
                        dangerouslySetInnerHTML={{
                          __html: he.decode(batchDetails.shortDescription),
                        }}
                      />
                    ) : (
                      <div className="space-y-3">
                        <div className="h-4 w-full bg-muted-foreground/30 animate-pulse rounded" />
                        <div className="h-4 w-5/6 bg-muted-foreground/30 animate-pulse rounded" />
                        <div className="h-4 w-4/6 bg-muted-foreground/30 animate-pulse rounded" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Sidebar */}
                <div className="lg:col-span-1">
                  <div className="sticky top-20">
                    <div className="bg-background border rounded-lg overflow-hidden shadow-md">
                      <div className="relative">
                        {batchDetails ? (
                          <>
                            <Image
                              src={
                                batchDetails.previewImage.baseUrl +
                                batchDetails.previewImage.key
                              }
                              alt={batchDetails.name}
                              width={400}
                              height={200}
                              className="w-full object-contain"
                              priority={true}
                            />
                          </>
                        ) : (
                          <>
                            <div className="h-8 w-full bg-muted-foreground/30 animate-pulse rounded p-2" />
                            <div className="h-8 w-full bg-muted-foreground/30 animate-pulse rounded p-2" />
                            <div className="h-8 w-full bg-muted-foreground/30 animate-pulse rounded p-2" />
                            <div className="h-8 w-full bg-muted-foreground/30 animate-pulse rounded p-2" />
                            <div className="h-8 w-full bg-muted-foreground/30 animate-pulse rounded p-2" />
                          </>
                        )}

                        <span className="absolute top-2 right-2 bg-yellow-400 text-xs px-2 py-1 rounded">
                          New
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          {batchDetails ? (
                            <>
                              <span className="text-sm text-muted-foreground">
                                {batchDetails.byName}
                              </span>
                              <span className="rounded-md bg-pink-50 dark:text-white dark:bg-muted px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-pink-700/10 ring-inset">
                                {batchDetails.language}
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="h-8 w-full bg-muted-foreground/30 animate-pulse rounded p-2" />
                            </>
                          )}
                        </div>
                        <div className="bg-green-50 dark:bg-muted rounded-lg p-3 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-green-600">🎯</span>
                            <span className="text-sm font-medium">
                              Enroll Now, To Ease Access
                            </span>
                          </div>
                        </div>
                        <Button
                          className="w-full flex items-center justify-center gap-2"
                          onClick={() =>
                            router.push(`/study/batches?batchid=/${batchId}/`)
                          }
                        >
                          ENROLL NOW
                          <BookmarkPlus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "classes" && (
            <div className="container mx-auto px-0 py-6">
              {/* Description Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* This Batch Includes */}
                <div className="divshadow bg-background border rounded-lg p-6">
                  <h3 className="text-2xl font-bold text-static-black max-md:text-xl max-sm:text-base mb-2">
                    Subjects
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                    {/* subjects */}

                    {/* Iterate over subjects */}
                    {batchDetails?.subjects?.length ? (
                      batchDetails.subjects.map((subject: any) => {
                        const imageUrl = subject.imageId
                          ? subject.imageId.baseUrl + subject.imageId.key
                          : `/assets/img/defaultSubject.svg`;

                        return (
                          <div
                            key={subject._id}
                            className="flex items-center gap-3 bg-backgorund border rounded-lg p-4 hover:shadow-md cursor-pointer divshadow transition-shadow"
                            onClick={() =>
                              router.push(
                                `/study/batches/${ batchDetails.batchId ?? batchDetails._id ?? batchDetails.slug}/subjects/${subject.slug}`
                              )
                            }
                          >
                            <div className="text-[#2a4365] text-xl flex-shrink-0">
                              <Image
                                src={imageUrl}
                                alt={subject.subject}
                                width={40}
                                height={40}
                              />
                            </div>
                            <div>
                              <div className="max-w-full sm:max-w-[140px] overflow-hidden">
                                <p className="font-semibold text-foreground truncate text-sm sm:text-base md:text-lg">
                                  {subject.subject}
                                </p>
                              </div>

                              <p className="text-xs text-muted-foreground">
                                {subject.tagCount} Chapters
                              </p>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <>
                        {[...Array(6)].map((_, index) => (
                          <div key={index} className="space-y-3">
                            <div className="h-4 w-full bg-muted-foreground/30 animate-pulse rounded" />
                            <div className="h-4 w-5/6 bg-muted-foreground/30 animate-pulse rounded" />
                            <div className="h-4 w-4/6 bg-muted-foreground/30 animate-pulse rounded" />
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }
}
