"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function BatchAnnouncement({ batchId }: { batchId: string }) {
  const [batchAnnouncement, setBatchAnnouncement] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBatchDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_PUBLIC_API}/announcement`,
          { batchId }
        );
        setBatchAnnouncement(response.data.data);
      } catch (error: any) {
        setError(
          error?.response?.data?.message || "Error fetching batch announcement"
        );
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (batchId) fetchBatchDetails();
  }, [batchId]);

  return (
    <div className="container mx-auto px-4 py-6">
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && batchAnnouncement && (
        <div>
          <h1 className="text-2xl font-bold mb-4">Batch Announcement</h1>
          <p>{batchAnnouncement.message || "No announcement content."}</p>
        </div>
      )}
    </div>
  );
}
