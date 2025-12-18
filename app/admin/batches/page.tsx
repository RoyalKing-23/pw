"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/utils/useDebounce";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Layers,
  Calendar,
  Users,
  Shield,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ArrowUp,
  Play,
  DollarSign,
  Globe,
  Plus,
} from "lucide-react";
import AdminLayout from "@/app/components/AdminLayout";
import { toast } from "sonner";

interface EnrolledUser {
  _id: string;
  UserName: string;
  phoneNumber: string;
  telegramId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenStatus?: boolean;
  randomId?: string;
  updatedAt: string;
}

interface Batch {
  _id: string;
  batchId: string;
  batchName: string;
  batchPrice: number;
  batchImage: string;
  template: string;
  BatchType: string;
  language: string;
  byName: string;
  startDate: string;
  endDate: string;
  batchStatus: boolean;
  enrolledUsers: EnrolledUser[];
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalBatches: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface TokenCheckResult {
  batchId: string;
  totalTokens: number;
  successCount: number;
  failedCount: number;
  results: Array<{
    userId: string;
    status: string;
    message: string;
  }>;
}

const PAGE_LIMIT_OPTIONS = [10, 25, 100, 500, 1000];

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tokenCheckResults, setTokenCheckResults] = useState<{
    [batchId: string]: TokenCheckResult;
  }>({});
  const [checkingTokens, setCheckingTokens] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const router = useRouter();
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (!debouncedSearchTerm.trim()) return; // ⛔ Don't run if search is empty
    setCurrentPage(1);

    fetchBatches();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    // Check if admin is logged in by making a test request
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/get-batches?page=1&limit=1", {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/admin/login");
            return;
          }
        }
        setAuthChecked(true);
        fetchBatches();
      } catch (error) {
        router.replace("/admin/login");
      }
    };

    checkAuth();
  }, [currentPage, pageLimit]);

  // Scroll to top functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchBatches = async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageLimit.toString(),
        search: debouncedSearchTerm,
      });

      const response = await fetch(`/api/admin/get-batches?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        throw new Error("Failed to fetch batches");
      }

      const data = await response.json();
      setBatches(data.batches);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to fetch batches");
      console.error("Error fetching batches:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveTokens = async (batchId: string) => {
    setCheckingTokens(batchId);

    try {
      const response = await fetch("/api/admin/get-batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ batchId }),
      });

      if (!response.ok) {
        throw new Error("Failed to check active tokens");
      }

      const data = await response.json();
      setTokenCheckResults((prev) => ({
        ...prev,
        [batchId]: data,
      }));

      // Show toast with results
      toast.success(
        `${data.successCount} active tokens, ${data.failedCount} failed tokens`
      );
    } catch (error) {
      toast.error("Failed to check active tokens");
      console.error("Error checking active tokens:", error);
    } finally {
      setCheckingTokens(null);
    }
  };

  const toggleBatchExpansion = (batchId: string) => {
    setExpandedBatch(expandedBatch === batchId ? null : batchId);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageLimitChange = (limit: string) => {
    const newLimit = parseInt(limit);
    setPageLimit(newLimit);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name: string) => {
    if (!name || typeof name !== "string") return "N/A";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getBatchTypeIcon = (type: string) => {
    switch (type) {
      case "FREE":
        return <Play className="w-4 h-4 text-green-500" />;
      case "PAID":
        return <DollarSign className="w-4 h-4 text-blue-500" />;
      default:
        return <Globe className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatPrice = (price: number) => {
    return Math.floor(price).toString();
  };

  const getTokenCheckIcon = (result: TokenCheckResult | undefined) => {
    if (!result) return null;

    if (result.successCount > 0 && result.failedCount === 0) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (result.successCount > 0 && result.failedCount > 0) {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    } else {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getTokenCheckText = (result: TokenCheckResult | undefined) => {
    if (!result) return "";

    if (result.successCount > 0 && result.failedCount === 0) {
      return `All ${result.successCount} tokens active`;
    } else if (result.successCount > 0 && result.failedCount > 0) {
      return `${result.successCount} active, ${result.failedCount} failed`;
    } else {
      return `All ${result.failedCount} tokens failed`;
    }
  };

  // Prevent rendering until auth check is done
  if (!authChecked) return null;

  return (
    <AdminLayout activePage="batches">
      <div className="p-3 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8 gap-3 lg:gap-4">
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-gray-900 mb-1">
              Batches
            </h1>
            <p className="text-sm lg:text-base text-gray-600">
              Manage and view all available batches
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
            <span className="text-xs lg:text-sm text-gray-500">
              {pagination?.totalBatches || 0} total batches
            </span>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4 lg:mb-6">
          {/* Search Bar */}
          <Card className="p-3 lg:p-4 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search batches by name, ID, or instructor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm lg:text-base"
              />
            </div>
          </Card>

          {/* Page Limit Selector */}
          <Card className="p-3 lg:p-4">
            <div className="flex items-center gap-2">
              <span className="text-xs lg:text-sm text-gray-600 whitespace-nowrap">
                Show:
              </span>
              <Select
                value={pageLimit.toString()}
                onValueChange={handlePageLimitChange}
              >
                <SelectTrigger className="w-20 lg:w-24 text-xs lg:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_LIMIT_OPTIONS.map((limit) => (
                    <SelectItem key={limit} value={limit.toString()}>
                      {limit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs lg:text-sm text-gray-600 whitespace-nowrap">
                per page
              </span>
            </div>
          </Card>
        </div>

        {/* Batches List */}
        {loading ? (
          <div className="flex items-center justify-center py-8 lg:py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm lg:text-base text-gray-600">
                Loading batches...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 lg:space-y-4">
            {batches.map((batch) => (
              <Card key={batch._id} className="overflow-hidden">
                {/* Batch Summary */}
                <div
                  className="p-3 lg:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleBatchExpansion(batch.batchId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-1">
                      <Avatar className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0">
                        <AvatarImage src={batch.batchImage || ""} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm lg:text-base">
                          {getInitials(batch.batchName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm lg:text-base truncate">
                          {batch.batchName}
                        </h3>
                        <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4 text-xs lg:text-sm text-gray-600">
                          <span className="flex items-center gap-1 truncate">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              {formatDate(batch.startDate)} -{" "}
                              {formatDate(batch.endDate)}
                            </span>
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            <Users className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              {batch.enrolledUsers.length} enrolled
                            </span>
                          </span>
                          <span className="flex items-center gap-1 truncate">
                            {getBatchTypeIcon(batch.BatchType)}
                            <span className="truncate">{batch.BatchType}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
                      <div className="hidden sm:flex items-center gap-2">
                        <Badge
                          variant={batch.batchStatus ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {batch.batchStatus ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ₹{formatPrice(batch.batchPrice)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {batch.language}
                        </Badge>
                      </div>
                      <div className="flex sm:hidden flex-col items-end gap-1">
                        <Badge
                          variant={batch.batchStatus ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {batch.batchStatus ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          ₹{formatPrice(batch.batchPrice)}
                        </Badge>
                      </div>
                      {expandedBatch === batch.batchId ? (
                        <ChevronUp className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Batch Details */}
                {expandedBatch === batch.batchId && (
                  <div className="border-t bg-gray-50 p-4 lg:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                      {/* Batch Details */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 lg:mb-4 text-sm lg:text-base">
                          Batch Details
                        </h4>
                        <div className="space-y-2 lg:space-y-3">
                          <div className="flex flex-row justify-between items-center gap-1">
                            <span className="text-xs lg:text-sm text-gray-600">
                              Batch ID:
                            </span>
                            <span className="text-xs lg:text-sm font-mono text-gray-900 text-right break-all">
                              {batch.batchId}
                            </span>
                          </div>

                          <div className="flex flex-row justify-between items-center gap-1">
                            <span className="text-xs lg:text-sm text-gray-600">
                              Instructor:
                            </span>
                            <span className="text-xs lg:text-sm text-gray-900 text-right break-all">
                              {batch.byName}
                            </span>
                          </div>

                          <div className="flex flex-row justify-between items-center gap-1">
                            <span className="text-xs lg:text-sm text-gray-600">
                              Language:
                            </span>
                            <span className="text-xs lg:text-sm text-gray-900 text-right">
                              {batch.language}
                            </span>
                          </div>

                          <div className="flex flex-row justify-between items-center gap-1">
                            <span className="text-xs lg:text-sm text-gray-600">
                              Type:
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs w-fit text-right"
                            >
                              {batch.BatchType}
                            </Badge>
                          </div>

                          <div className="flex flex-row justify-between items-center gap-1">
                            <span className="text-xs lg:text-sm text-gray-600">
                              Price:
                            </span>
                            <span className="text-xs lg:text-sm text-gray-900 text-right">
                              ₹{formatPrice(batch.batchPrice)}
                            </span>
                          </div>

                          <div className="flex flex-row justify-between items-center gap-1">
                            <span className="text-xs lg:text-sm text-gray-600">
                              Status:
                            </span>
                            <Badge
                              variant={
                                batch.batchStatus ? "default" : "secondary"
                              }
                              className="text-xs w-fit text-right"
                            >
                              {batch.batchStatus ? "Active" : "Inactive"}
                            </Badge>
                          </div>

                          <div className="flex flex-row justify-between items-center gap-1">
                            <span className="text-xs lg:text-sm text-gray-600">
                              Created:
                            </span>
                            <span className="text-xs lg:text-sm text-gray-900 text-right">
                              {formatDate(batch.createdAt)}
                            </span>
                          </div>

                          <div className="flex flex-row justify-between items-center gap-1">
                            <span className="text-xs lg:text-sm text-gray-600">
                              Updated:
                            </span>
                            <span className="text-xs lg:text-sm text-gray-900 text-right">
                              {formatDate(batch.updatedAt)}
                            </span>
                          </div>

                          {/* Token Check Section */}
                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex flex-row justify-between items-center gap-2">
                              {tokenCheckResults[batch.batchId] && (
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-gray-500" />
                                  <span className="text-xs lg:text-sm text-gray-600">
                                    Token Status:
                                  </span>
                                  {getTokenCheckIcon(
                                    tokenCheckResults[batch.batchId]
                                  )}
                                  <span className="text-xs lg:text-sm font-medium">
                                    {getTokenCheckText(
                                      tokenCheckResults[batch.batchId]
                                    )}
                                  </span>
                                </div>
                              )}

                              {!tokenCheckResults[batch.batchId] ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    checkActiveTokens(batch.batchId);
                                  }}
                                  disabled={checkingTokens === batch.batchId}
                                  className="text-xs px-2 py-1 lg:px-3 lg:py-2 w-full"
                                >
                                  {checkingTokens === batch.batchId ? (
                                    <div className="flex items-center gap-1">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                      <span>Checking...</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <Shield className="w-3 h-3 mr-1" />
                                      <span>Check Active Tokens</span>
                                    </div>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    checkActiveTokens(batch.batchId);
                                  }}
                                  disabled={checkingTokens === batch.batchId}
                                  className="text-xs p-1 lg:p-2"
                                >
                                  {checkingTokens === batch.batchId ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                  ) : (
                                    <RefreshCw className="w-3 h-3 lg:w-4 lg:h-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enrolled Users */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 lg:mb-4 text-sm lg:text-base">
                          Enrolled Users
                        </h4>
                        {batch.enrolledUsers.length > 0 ? (
                          <div className="bg-white rounded-lg border max-h-64 overflow-y-auto">
                            <div className="p-2 lg:p-3">
                              {batch.enrolledUsers.map((user, index) => (
                                <div
                                  key={user._id || `user-${index}`}
                                  className={`flex items-center justify-between p-2 rounded-lg ${index !== batch.enrolledUsers.length - 1
                                    ? "border-b border-gray-100"
                                    : ""
                                    }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <Avatar className="w-6 h-6 lg:w-8 lg:h-8 flex-shrink-0">
                                      <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                                        {getInitials(user.UserName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-xs lg:text-sm font-medium text-gray-900 truncate">
                                        {user.UserName}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate">
                                        {user.phoneNumber}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Badge
                                      variant={
                                        user.tokenStatus
                                          ? "default"
                                          : "secondary"
                                      }
                                      className="text-xs"
                                    >
                                      {user.tokenStatus ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-xs lg:text-sm text-gray-500">
                              No users enrolled
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {/* Empty State */}
            {batches.length === 0 && !loading && (
              <Card className="p-8 lg:p-12">
                <div className="text-center">
                  <Layers className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-3 lg:mb-4" />
                  <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">
                    No batches found
                  </h3>
                  <p className="text-sm lg:text-base text-gray-600">
                    {searchTerm
                      ? "Try adjusting your search terms"
                      : "No batches have been created yet"}
                  </p>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <Card className="p-3 lg:p-4 mt-4 lg:mt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs lg:text-sm text-gray-600 text-center sm:text-left">
                Showing page {pagination.currentPage} of {pagination.totalPages}
                ({pagination.totalBatches} total batches)
              </div>
              <div className="flex items-center gap-1 lg:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="text-xs px-2 py-1 lg:px-3 lg:py-2"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.totalPages) },
                    (_, i) => {
                      const page =
                        Math.max(
                          1,
                          Math.min(
                            pagination.totalPages - 4,
                            pagination.currentPage - 2
                          )
                        ) + i;
                      if (page > pagination.totalPages) return null;
                      return (
                        <Button
                          key={`page-${page}`}
                          variant={
                            page === pagination.currentPage
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="w-6 h-6 lg:w-8 lg:h-8 p-0 text-xs"
                        >
                          {page}
                        </Button>
                      );
                    }
                  ).filter(Boolean)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="text-xs px-2 py-1 lg:px-3 lg:py-2"
                >
                  Next
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 rounded-full w-12 h-12 p-0 shadow-lg hover:shadow-xl transition-all duration-200"
          size="sm"
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
      )}
    </AdminLayout>
  );
}
