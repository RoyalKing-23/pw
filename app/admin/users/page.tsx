"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/utils/useDebounce";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import * as Tooltip from '@radix-ui/react-tooltip';
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
  User,
  Users,
  Calendar,
  Phone,
  Send,
  Shield,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  ArrowUp,
  ShieldCheck,
  Code2,
  Briefcase,
  UserIcon,
  BadgeCheck,
} from "lucide-react";
import AdminLayout from "@/app/components/AdminLayout";
import { toast } from "sonner";

interface User {
  _id: string;
  UserName: string;
  phoneNumber: string;
  telegramId?: string;
  telegramName?: string;
  telegramUsername?: string;
  photoUrl?: string;
  tag?: string;
  hasLoggedIn: boolean;
  enrolledBatches: { batchId: string; name: string }[];
  batches: { batchId: string; batchName: string }[];
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface TokenStatus {
  status: "valid" | "expired" | "no_token" | "error";
  message: string;
  data?: any;
  error?: any;
}

const PAGE_LIMIT_OPTIONS = [10, 25, 100, 500, 1000];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<{
    [userId: string]: TokenStatus;
  }>({});
  const [checkingToken, setCheckingToken] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const router = useRouter();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (!debouncedSearchTerm.trim()) return; // ⛔ Don't run if search is empty
    setCurrentPage(1);

    fetchUsers();
  }, [debouncedSearchTerm]);

  useEffect(() => {
    // Check if admin is logged in by making a test request
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/get-users?page=1&limit=1", {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/admin/login");
            return;
          }
        }
        setAuthChecked(true);
        fetchUsers();
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

  const fetchUsers = async () => {
    setLoading(true);
    // if (!debouncedSearchTerm.trim()) return; // ⛔ Don't run if search is empty

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageLimit.toString(),
        search: debouncedSearchTerm,
      });

      const response = await fetch(`/api/admin/get-users?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkTokenStatus = async (userId: string) => {
    setCheckingToken(userId);

    try {
      const response = await fetch("/api/admin/get-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to check token status");
      }

      const data = await response.json();
      setTokenStatus((prev) => ({
        ...prev,
        [userId]: data,
      }));

      // Show toast based on status
      if (data.status === "valid") {
        toast.success("Token is valid");
      } else if (data.status === "expired") {
        toast.error("User token expired");
      } else if (data.status === "no_token") {
        toast.warning("User has no access token");
      } else {
        toast.error(data.message || "Error checking token status");
      }
    } catch (error) {
      toast.error("Failed to check token status");
      console.error("Error checking token status:", error);
    } finally {
      setCheckingToken(null);
    }
  };

  const toggleUserExpansion = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  // Reset page when search term changes


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

  const getTokenStatusIcon = (status: TokenStatus | undefined) => {
    if (!status) return null;

    switch (status.status) {
      case "valid":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "expired":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "no_token":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getBadge = (tag: any) => {
    switch (tag) {
      case "admin":
        return { icon: ShieldCheck, color: "text-red-500", label: "Admin" };
      case "developer":
        return { icon: Code2, color: "text-purple-500", label: "Developer" };
      case "manager":
        return { icon: Briefcase, color: "text-green-600", label: "Manager" };
      case "user":
        return { icon: UserIcon, color: "text-blue-500", label: "User" };
      default:
        return { icon: BadgeCheck, color: "text-gray-500", label: "Member" };
    }
  };

  const getTokenStatusText = (status: TokenStatus | undefined) => {
    if (!status) return "";

    switch (status.status) {
      case "valid":
        return "Token is valid";
      case "expired":
        return "User token expired";
      case "no_token":
        return "User has no access token";
      case "error":
        return status.message || "Error checking token";
      default:
        return "";
    }
  };

  // Prevent rendering until auth check is done
  if (!authChecked) return null;

  return (
    <AdminLayout activePage="users">
      <div className="p-3 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8 gap-3 lg:gap-4">
          <div>
            <h1 className="text-xl lg:text-3xl font-bold text-gray-900 mb-1">
              Users
            </h1>
            <p className="text-sm lg:text-base text-gray-600">
              Manage and view all registered users
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
            <span className="text-xs lg:text-sm text-gray-500">
              {pagination?.totalUsers || 0} total users
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
                placeholder="Search users by name, phone, or telegram ID..."
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
                <SelectTrigger className="w-20 lg:w-24 text-xs lg:text-sm focus:outline-none focus:ring-0 focus:shadow-none">
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

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-8 lg:py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 lg:h-8 lg:w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm lg:text-base text-gray-600">
                Loading users...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 lg:space-y-4">
            {users.map((user) => (
              <Card key={user._id} className="overflow-hidden">
                {/* User Summary */}
                <div
                  className="p-3 lg:p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleUserExpansion(user._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-1">
                      <Avatar className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0">
                        <AvatarImage src={user.photoUrl || ""} />
                        <AvatarFallback className="bg-indigo-100 text-indigo-600 text-sm lg:text-base">
                          {getInitials(user.UserName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm lg:text-base truncate flex items-center gap-2">
                          {user.UserName}
                          <span className="flex items-center gap-1 text-xs py-0.5 rounded-full bg-gray-100">
                            {(() => {
                              const badge = getBadge(user?.tag);
                              const Icon = badge.icon;
                              return (
                                <Tooltip.Provider delayDuration={100}>
                                  <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                      <Icon className={`w-4 h-4 ${badge.color} cursor-pointer`} />
                                    </Tooltip.Trigger>
                                    <Tooltip.Content
                                      className="bg-gray-900 text-white text-xs rounded px-2 py-1 z-50"
                                      side="top"
                                      sideOffset={4}
                                    >
                                      {badge.label}
                                      <Tooltip.Arrow className="fill-gray-900" />
                                    </Tooltip.Content>
                                  </Tooltip.Root>
                                </Tooltip.Provider>
                              );
                            })()}
                          </span>
                        </h3>
                        <div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-4 text-xs lg:text-sm text-gray-600">
                          <span className="flex items-center gap-1 truncate">
                            <Phone className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{user.phoneNumber}</span>
                          </span>
                          {user.telegramId && (
                            <span className="flex items-center gap-1 truncate">
                              <Send className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                {user.telegramId}
                              </span>
                            </span>
                          )}
                          <span className="flex items-center gap-1 truncate">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              {formatDate(user.createdAt)}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
                      <div className="hidden sm:flex items-center gap-2">
                        <Badge
                          variant={user.hasLoggedIn ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {user.hasLoggedIn ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {user.batches.length} batches
                        </Badge>
                      </div>
                      <div className="flex sm:hidden flex-col items-end gap-1">
                        <Badge
                          variant={user.hasLoggedIn ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {user.hasLoggedIn ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {user.batches.length} batches
                        </Badge>
                      </div>
                      {expandedUser === user._id ? (
                        <ChevronUp className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded User Details */}
                {expandedUser === user._id && (
                  <div className="border-t bg-gray-50 p-4 lg:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                      {/* User Details */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 lg:mb-4 text-sm lg:text-base">
                          User Details
                        </h4>
                        <div className="space-y-2 lg:space-y-3">
                          <div className="flex flex-row justify-between gap-1">
                            <span className="text-xs lg:text-sm text-gray-600">
                              User ID:
                            </span>
                            <span className="text-xs lg:text-sm font-mono text-gray-900 break-all">
                              {user._id}
                            </span>
                          </div>
                          <div className="flex flex-row justify-between gap-1">
                            <span className="text-xs lg:text-sm text-gray-600">
                              Phone Number:
                            </span>
                            <span className="text-xs lg:text-sm text-gray-900 break-all">
                              {user.phoneNumber}
                            </span>
                          </div>
                          {user.telegramId && (
                            <div className="flex flex-row justify-between gap-1">
                              <span className="text-xs lg:text-sm text-gray-600">
                                Telegram ID:
                              </span>
                              <span className="text-xs lg:text-sm text-gray-900 break-all">
                                {user.telegramId}
                              </span>
                            </div>
                          )}
                          {user.telegramName && (
                            <div className="flex fflex-row justify-between gap-1">
                              <span className="text-xs lg:text-sm text-gray-600">
                                Telegram Name:
                              </span>
                              <span className="text-xs lg:text-sm text-gray-900 break-all">
                                {user.telegramName}
                              </span>
                            </div>
                          )}
                          {user.telegramUsername && (
                            <div className="flex flex-row justify-between gap-1">
                              <span className="text-xs lg:text-sm text-gray-600">
                                Telegram Username:
                              </span>
                              <span className="text-xs lg:text-sm text-gray-900 break-all">
                                {user.telegramUsername}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-row justify-between items-center gap-1">
                            <span className="text-xs lg:text-sm text-gray-600">
                              Status:
                            </span>
                            <Badge
                              variant={
                                user.hasLoggedIn ? "default" : "secondary"
                              }
                              className="text-xs w-fit"
                            >
                              {user.hasLoggedIn
                                ? "Has Logged In"
                                : "Never Logged In"}
                            </Badge>
                          </div>
                          <div className="flex flex-row justify-between gap-1">
                            <span className="text-xs lg:text-sm text-gray-600">
                              Registered:
                            </span>
                            <span className="text-xs lg:text-sm text-gray-900">
                              {formatDate(user.createdAt)}
                            </span>
                          </div>
                          <div className="flex flex-row justify-between gap-1">
                            <span className="text-xs lg:text-sm text-gray-600">
                              Last Logged In:
                            </span>
                            <span className="text-xs lg:text-sm text-gray-900">
                              {formatDate(user.updatedAt)}
                            </span>
                          </div>

                          {/* Token Status Section */}
                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex flex-row justify-between items-center gap-2">
                              {tokenStatus[user._id] && (
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-gray-500" />
                                  <span className="text-xs lg:text-sm text-gray-600">
                                    Token Status:
                                  </span>
                                  {getTokenStatusIcon(tokenStatus[user._id])}
                                  <span className="text-xs lg:text-sm font-medium">
                                    {getTokenStatusText(tokenStatus[user._id])}
                                  </span>
                                </div>
                              )}

                              {!tokenStatus[user._id] ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    checkTokenStatus(user._id);
                                  }}
                                  disabled={checkingToken === user._id}
                                  className="text-xs px-2 py-1 lg:px-3 lg:py-2 w-full"
                                >
                                  {checkingToken === user._id ? (
                                    <div className="flex items-center gap-1">
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                                      <span>Checking...</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <Shield className="w-3 h-3 mr-1" />
                                      <span>Check Token Status</span>
                                    </div>
                                  )}
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    checkTokenStatus(user._id);
                                  }}
                                  disabled={checkingToken === user._id}
                                  className="text-xs p-1 lg:p-2"
                                >
                                  {checkingToken === user._id ? (
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

                      {/* Enrolled Batches */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 lg:mb-4 text-sm lg:text-base">
                          Purchased Batches
                        </h4>
                        {user.batches.length > 0 ? (
                          <div className="space-y-2  rounded-lg border max-h-64 overflow-y-auto">
                            {user.batches.map((batch) => (
                              <div
                                key={batch.batchId}
                                className="flex flex-row justify-between items-center p-2 lg:p-3 bg-white rounded-lg border gap-2"
                              >
                                <div className="flex flex-row items-center gap-1 text-xs lg:text-sm font-medium text-gray-900">
                                  <span>{batch.batchName}</span>
                                  <span className="block lg:hidden">-</span>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="text-xs w-fit"
                                >
                                  {batch.batchId}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-xs lg:text-sm text-gray-500">
                              Muft ka chandan
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
            {users.length === 0 && !loading && (
              <Card className="p-8 lg:p-12">
                <div className="text-center">
                  <User className="w-8 h-8 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-3 lg:mb-4" />
                  <h3 className="text-base lg:text-lg font-medium text-gray-900 mb-2">
                    No users found
                  </h3>
                  <p className="text-sm lg:text-base text-gray-600">
                    {searchTerm
                      ? "Try adjusting your search terms"
                      : "No users have been registered yet"}
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
                ({pagination.totalUsers} total users)
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
                          key={page}
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
                  )}
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
