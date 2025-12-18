"use client";

import { useEffect, useState } from "react";
import BatchCard from "@/app/components/BatchCard";
import { getEnrolledBatches, BatchInfo } from "@/utils/api";
import { useRouter } from "next/navigation";

// Helper to format ISO date to dd-mm-yyyy in IST, but only on client to avoid hydration mismatch
function toISTDateString(dateStr?: string): string {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "-";
  // Use toLocaleString with IST
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export default function MyBatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [batchesWithIST, setBatchesWithIST] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchMyBatches = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getEnrolledBatches();
        const enrolled = data.enrolledBatches || [];
        if (!enrolled.length) {
          setBatches([]);
          setLoading(false);
          return;
        }
        // Fetch full details for each batch
        const details = await Promise.all(
          enrolled.map(async (batch: any) => {
            try {
              const res = await BatchInfo(batch.batchId, "details");
              const info = res.data || {};
              return {
                ...info,
                _id: batch._id,
                batchId: batch.batchId,
                batchName: batch.name || info.batchName,
                batchImage: info.iosPreviewImageUrl || (info.previewImage?.baseUrl && info.previewImage?.key ? info.previewImage.baseUrl + info.previewImage.key : "/assets/img/defaultSubject.svg"),
                startDate: info.startDate,
                endDate: info.endDate,
                language: info.language,
                batchPrice: info.batchPrice,
                byName: info.byName,
              };
            } catch (e) {
              return null;
            }
          })
        );
        setBatches(details.filter(Boolean));
      } catch (err: any) {
        setError(
          err?.message || "Failed to load your enrolled batches. Please try again."
        );
        setBatches([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMyBatches();
  }, []);

  // Compute IST dates after batches are loaded
  useEffect(() => {
    if (!batches.length) {
      setBatchesWithIST([]);
      return;
    }
    setBatchesWithIST(
      batches.map((batch) => ({
        ...batch,
        startDateIST: toISTDateString(batch.startDate),
        endDateIST: toISTDateString(batch.endDate),
      }))
    );
  }, [batches]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-background border rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-4">My Batches</h1>
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center">
            {error}
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <BatchCard isPlaceholder />
            <BatchCard isPlaceholder />
            <BatchCard isPlaceholder />
          </div>
        ) : batchesWithIST.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {batchesWithIST.map((batch, idx) => (
              <div key={batch.batchId}>
                <BatchCard
                  id={batch.batchId}
                  title={batch.batchName}
                  image={batch.batchImage || "/assets/img/defaultSubject.svg"}
                  type={batch.language}
                  startDate={batch.startDateIST}
                  endDate={batch.endDateIST}
                  price={batch.batchPrice?.toFixed(0) || "0"}
                  forText={batch.byName || ""}
                  priority={idx === 0}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-8">You are not enrolled in any batches yet.</div>
        )}
      </div>
    </div>
  );
} 