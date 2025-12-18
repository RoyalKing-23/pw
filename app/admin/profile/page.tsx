"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AdminLayout from "@/app/components/AdminLayout";
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

export default function AdminProfile() {
  const [currentUsername, setCurrentUsername] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Fetch current admin data
    fetch("/api/admin/adminServer", {
      credentials: "include", // Ensure cookies (like admin_token) are sent
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Unauthorized");
        const data = await res.json();
        const username = data.serverConfig?.username || "";
        setCurrentUsername(username);
        setNewUsername("");
        setLoadingData(false);
        setAuthChecked(true);
      })
      .catch((error) => {
        console.error("API Error:", error);
        router.replace("/admin/login");
      });
  }, [router]);

  // Prevent rendering until auth check is done
  if (!authChecked && !loadingData) return null;

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/adminServer", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookie with request
        body: JSON.stringify({ username: newUsername }),
      });

      if (response.ok) {
        toast.success("Username updated successfully");
        setCurrentUsername(newUsername);
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update username");
      }
    } catch (error) {
      toast.error("An error occurred while updating username");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/adminServer", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include the cookie automatically
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        toast.success("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update password");
      }
    } catch (error) {
      toast.error("An error occurred while updating password");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <AdminLayout activePage="profile">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePage="profile">
      <div className="p-4 lg:p-8">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <p className="text-gray-600">Manage your admin account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Username Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Username</h2>
                <p className="text-sm text-gray-600">Update your admin username</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="current-username" className="text-sm font-medium text-gray-700">
                  Current Username
                </Label>
                <Input
                  id="current-username"
                  value={currentUsername}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="new-username" className="text-sm font-medium text-gray-700">
                  New Username
                </Label>
                <Input
                  id="new-username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Enter new username"
                  className="mt-1"
                />
              </div>

              <Button
                onClick={handleUpdateUsername}
                disabled={loading || newUsername === currentUsername || !newUsername.trim()}
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </div>
                ) : (
                  "Update Username"
                )}
              </Button>
            </div>
          </Card>

          {/* Password Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Password</h2>
                <p className="text-sm text-gray-600">Change your admin password</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="current-password" className="text-sm font-medium text-gray-700">
                  Current Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                  New Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                  Confirm New Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                onClick={handleUpdatePassword}
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </div>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Security Tips */}
        <Card className="mt-8 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Strong Password</h4>
                <p className="text-sm text-gray-600">Use a combination of letters, numbers, and special characters</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Regular Updates</h4>
                <p className="text-sm text-gray-600">Change your password regularly for better security</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Keep Private</h4>
                <p className="text-sm text-gray-600">Never share your admin credentials with anyone</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-gray-900">Secure Access</h4>
                <p className="text-sm text-gray-600">Always log out when accessing from shared devices</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
} 