"use client";

import { useEffect, useState } from 'react';
import BatchCard from '@/app/components/BatchCard';
import { Button } from '@/components/ui/button';
import { fetchBatches, searchBatch } from '@/utils/api';
import { useDebounce } from '@/utils/useDebounce';
import { Search } from 'lucide-react';
import { format, parseISO } from "date-fns";
import dynamic from 'next/dynamic';
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

const Carousel = dynamic(() => import('@/app/components/Carousel'), { ssr: false });

export interface Batch {
  _id: string;
  batchId: string;
  batchName: string;
  batchImage: string;
  language: string;
  template: string;
  startDate: string;
  endDate: string;
  batchPrice: number;
  byName: string;
}
export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr); // safely parse ISO string
  return format(date, "dd MMM yyyy"); // e.g., "13 Apr 2025"
}

export default function BatchesClient() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const searchParams = useSearchParams();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const toastMsg = searchParams?.get("toast");
    if (toastMsg) {
      toast.error(decodeURIComponent(toastMsg));
    }
  }, [searchParams, toast]);

  // Fetch or search based on debounced input
  useEffect(() => {
    if (!hasMounted) return;

    const fetchData = async () => {
      setLoading(true);

      try {
        const activeSearch = debouncedSearchTerm.trim() !== '';
        const response = activeSearch
          ? await searchBatch(debouncedSearchTerm, page)
          : await fetchBatches(page.toString());

        const newBatches = response?.data || [];
        const currentPage = response?.currentPage || 1;
        const totalPages = response?.totalPages || 1;

        setBatches((prev) =>
          page === 1 ? newBatches : [...prev, ...newBatches]
        );
        setHasMore(currentPage < totalPages);
      } catch (err: any) {
        console.error('Fetch failed:', err);
        if (err.response?.status === 401) {
          toast.error("Unauthorized: Please login again.");
        } else {
          toast.error("Failed to load enrolled batches");
        }
        if (page === 1) setBatches([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearchTerm, page,hasMounted]);

  // Reset page when search term changes
  useEffect(() => {
    setPage(1);
    setBatches([]);
  }, [debouncedSearchTerm]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Triggers refetch due to useEffect
  };
    if (!hasMounted) return;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-background border rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-4">Batches</h1>

        {/* Search Form */}
        <form
          onSubmit={handleSearch}
          className="divshadow flex flex-wrap items-center gap-3 sm:gap-5"
        >
          <div className="relative w-full">
            <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
              <Search strokeWidth={3} className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow block w-full p-4 ps-10 text-sm divshadow border rounded-md focus:outline-none outline-none bg-foreground/10"
              placeholder="Search Your Batch"
            />
            <button
              type="submit"
              className="absolute end-2.5 bottom-2.5 font-medium rounded-lg text-sm px-4 py-2 bg-green-400 dark:bg-green-500 text-white"
            >
              Search
            </button>
          </div>
        </form>

        {/* Carousel */}
        <Carousel
          items={[
            {
              content: (
                <img
                  src="https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/2cd05c71-3897-4e88-9c73-3e307e0dde03.jpg"
                  alt="Slide 1"
                  className="w-full h-full object-contain"
                />
              ),
            },
            {
              content: (
                <img
                  src="https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/4f17deae-eab1-4b19-b5cb-2bb2291d60e5.jpg"
                  alt="Slide 2"
                  className="w-full h-full object-contain"
                />
              ),
            },
            {
              content: (
                <img
                  src="https://static.pw.live/5eb393ee95fab7468a79d189/ADMIN/afeb7785-0e5e-4fc9-95e7-57b328032009.jpg"
                  alt="Slide 3"
                  className="w-full h-full object-contain"
                />
              ),
            },
          ]}
        />

        {/* Batches Grid */}
        {loading && page === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <BatchCard isPlaceholder />
            <BatchCard isPlaceholder />
            <BatchCard isPlaceholder />
          </div>
        ) : batches.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {batches
                .filter((batch) => batch.template === 'NORMAL')
                .map((batch) => (
                  <BatchCard
                    key={batch._id}
                    id={batch.batchId}
                    title={batch.batchName}
                    image={batch.batchImage}
                    type={batch.language}
                    startDate={formatDate(batch.startDate)}
                    endDate={formatDate(batch.endDate)}

                    price={batch.batchPrice?.toFixed(0) || '0'}
                    forText={batch.byName || ''}
                  />
                ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center mt-8">No batches found.</p>
        )}
      </div>
    </div>
  );
} 