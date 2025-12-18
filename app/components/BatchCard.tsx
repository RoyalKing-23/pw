"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { enrollBatch, UnenrollBatch } from "@/utils/api";
import { toast } from "sonner";
// import { checkVerification } from "@/utils/checkVerification";

import {
  UserCheck,
  CalendarCheck2,
  GraduationCap,
  BookmarkPlus,
  PinOff,
} from "lucide-react";

export type BatchCardProps = {
  id?: string;
  title?: string;
  type?: string;
  image?: string;
  startDate?: string;
  endDate?: string;
  price?: string;
  forText?: string;
  isPlaceholder?: boolean;
  priority?: boolean;
};

export default function BatchCard({
  id = "",
  title = "",
  type = "",
  image,
  startDate = "",
  endDate = "",
  price = "",
  forText = "",
  isPlaceholder = false,
  priority = false,
}: BatchCardProps) {
  const router = useRouter();

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const displayImage = image || "/assets/img/video-placeholder.svg";
  const showEnrollButton = hasMounted && isEnrolled;
const [isClient, setIsClient] = useState(false);
useEffect(() => setIsClient(true), []);

  useEffect(() => {
    setHasMounted(true);
  }, []);


  useEffect(() => {
    if (!hasMounted) return;

    const updateEnrollmentStatus = () => {
      const enrolledBatchesStr =
        localStorage.getItem("enrolledBatches") || "[]";
      try {
        const enrolledBatches = JSON.parse(enrolledBatchesStr) as {
          batchId: string;
        }[];
        const enrolled = enrolledBatches.some((batch) => batch.batchId === id);
        setIsEnrolled(enrolled);
      } catch (e) {
        console.error("Failed to parse enrolledBatches from localStorage", e);
      }
    };

    updateEnrollmentStatus(); // run on mount
    window.addEventListener("batchesUpdated", updateEnrollmentStatus);

    return () => {
      window.removeEventListener("batchesUpdated", updateEnrollmentStatus);
    };
  }, [id, hasMounted]);


  const handleEnroll = async () => {
    try {
      const res = await enrollBatch(id, title);

      if (res.success) {
        const enrolledBatchesStr =
          localStorage.getItem("enrolledBatches") || "[]";
        let enrolledBatches = [];

        try {
          enrolledBatches = JSON.parse(enrolledBatchesStr);
          if (!Array.isArray(enrolledBatches)) {
            enrolledBatches = [];
          }
        } catch (e) {
          console.error("Invalid JSON in localStorage:", e);
          enrolledBatches = [];
        }

        const alreadyExists = enrolledBatches.some(
          (batch) => batch.batchId === id
        );

        if (!alreadyExists) {
          enrolledBatches.push({ batchId: id, name: title });
          localStorage.setItem(
            "enrolledBatches",
            JSON.stringify(enrolledBatches)
          );
          toast.success(`You've successfully enrolled in "${title}".`);
        } else {
          toast("You're already enrolled in this batch.");
        }

        window.dispatchEvent(new Event("batchesUpdated"));
        setIsEnrolled(true);
      } else {
        toast.error(res.message || "Enrollment failed. Please try again.");
      }
    } catch (err: any) {
      console.error("Error during enrollment:", err);
      toast.error("An error occurred while enrolling.");
    }
  };

  const handleUnenroll = async () => {
    try {
      const resx = await UnenrollBatch(id, title);
      if (resx.success) {
        const enrolledBatchesStr =
          localStorage.getItem("enrolledBatches") || "[]";

        let enrolledBatches = [];
        try {
          enrolledBatches = JSON.parse(enrolledBatchesStr);
          if (!Array.isArray(enrolledBatches)) {
            enrolledBatches = [];
          }
        } catch (e) {
          console.error("Invalid JSON in localStorage:", e);
          enrolledBatches = [];
        }

        enrolledBatches = enrolledBatches.filter(
          (batch: any) => batch.batchId !== id
        );
        localStorage.setItem(
          "enrolledBatches",
          JSON.stringify(enrolledBatches)
        );

        window.dispatchEvent(new Event("batchesUpdated"));
        setIsEnrolled(false);

        toast.success(`You have been unenrolled from "${title}".`);
      } else {
        toast.error(resx.message || "Failed to unenroll. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("An error occurred while unenrolling.");
    }
  };

  if (isPlaceholder) {
    return (
      <div className="border rounded-xl p-4 space-y-4 animate-pulse bg-muted">
        <div className="h-6 bg-muted-foreground/30 rounded w-3/4" />
        <div className="h-48 bg-muted-foreground/30 rounded" />
        <div className="h-4 bg-muted-foreground/30 rounded w-1/2" />
        <div className="h-4 bg-muted-foreground/30 rounded w-3/4" />
        <div className="flex gap-2">
          <div className="h-8 bg-muted-foreground/30 rounded w-1/2" />
          <div className="h-8 bg-muted-foreground/30 rounded w-1/2" />
        </div>
      </div>
    );
  }
  if (!hasMounted) return null;

  return (
    <div className="border rounded-xl overflow-hidden hover:shadow-lg dark:border-gray-700 transition-shadow bg-white dark:bg-gray-900 flex flex-wrap">
      <div className="p-4 pb-0 gap-1 space-y-3 relative flex items-center justify-between w-full">
        <h1 className="line-clamp-2 text-lg font-bold">{title}</h1>
        <div className="items-center !m-0">
          <span className="bg-yellow-400 text-xs px-2 py-1 rounded font-medium">
            New
          </span>
        </div>
      </div>

      <div className="w-full p-4 flex flex-wrap justify-between">
        <div className="w-full rounded-lg overflow-hidden relative">

          <Image
            src={displayImage}
            alt={title}
            width={400}
            height={200}
            className="w-full object-contain"
            priority={priority}
          />

          <div className="absolute bottom-2 left-2 z-10">
            <span className="rounded-md bg-pink-500/70 dark:text-white dark:bg-green-500/80 px-2 py-1 text-xs font-medium text-white ring-1 ring-pink-700/10 ring-inset">
              {type || "Hinglish"}
            </span>
          </div>
        </div>

        <div className="pt-3 space-y-3 w-full">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <UserCheck className="w-4 h-4" />
            <span className="text-xs font-semibold text-foreground">
              {forText}
            </span>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <CalendarCheck2 className="w-4 h-4" />
            Starts on
            <span className="text-xs font-semibold text-foreground">
              {startDate}
            </span>
            | Ends on
            <span className="text-xs font-semibold text-foreground">
              {endDate}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">
                ₹ FREE
              </span>
              {price && (
                <span className="text-xs text-muted-foreground line-through ml-2">
                  ₹{price}
                </span>
              )}
            </div>
            <span className="text-xs bg-green-50 dark:bg-green-500 text-green-600 dark:text-white px-2 py-1 rounded">
              100% Free For Students
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="flex-1 min-w-[120px]"
              onClick={() => router.push(`/study/batches/${id}`)}
            >
              <GraduationCap className="w-4 h-4 mr-2" />
              Study
            </Button>
           
            {hasMounted && (
              showEnrollButton ? (
                <Button
                  variant="destructive"
                  className="flex-1 min-w-[120px] text-xs sm:text-sm bg-red-600 hover:bg-red-700"
                  onClick={handleUnenroll}
                >
                  <PinOff className="ml-1 w-4 h-4" /> Unenroll
                </Button>
              ) : (
                <Button
                  className="flex-1 min-w-[120px] text-xs sm:text-sm bg-green-400 text-white hover:bg-green-600 dark:hover:text-white"
                  onClick={handleEnroll}
                >
                  Enroll Now <BookmarkPlus className="ml-1 w-4 h-4" />
                </Button>
              )
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
