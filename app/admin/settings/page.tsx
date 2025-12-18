"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "@/app/components/AdminLayout";
import { 
  Globe, 
  MessageSquare,
  Save,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface ServerConfig {
  webName: string;
  registrationOpen: boolean;
  sidebarLogoUrl: string;
  sidebarTitle: string;
  isDirectLoginOpen: boolean;
  tg_bot: string;
  tg_channel: string;
  tg_username: string;
}

export default function AdminSettings() {
  const [config, setConfig] = useState<ServerConfig>({
    webName: "",
    registrationOpen: false,
    sidebarLogoUrl: "",
    sidebarTitle: "",
    isDirectLoginOpen: false,
    tg_bot: "",
    tg_channel: "",
    tg_username: ""
  });
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // No need to manually get token from localStorage
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/admin/adminServer", {
          credentials: "include", // Automatically includes cookies
        });

        if (!res.ok) throw new Error("Unauthorized");

        const data = await res.json();
        const serverConfig = data.serverConfig || {};

        setConfig({
          webName: serverConfig.webName || "",
          registrationOpen: serverConfig.registrationOpen || false,
          sidebarLogoUrl: serverConfig.sidebarLogoUrl || "",
          sidebarTitle: serverConfig.sidebarTitle || "",
          isDirectLoginOpen: serverConfig.isDirectLoginOpen || false,
          tg_bot: serverConfig.tg_bot || "",
          tg_channel: serverConfig.tg_channel || "",
          tg_username: serverConfig.tg_username || ""
        });

        setLoadingData(false);
        setAuthChecked(true);
      } catch (error) {
        console.error("API Error:", error);
        router.replace("/admin/login");
      }
    };

    fetchConfig();
  }, [router]);

  // Prevent rendering until auth check is done
  if (!authChecked && !loadingData) return null;

  const handleSave = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/adminServer", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Automatically includes HTTP-only cookies
        body: JSON.stringify(config),
      });

      if (response.ok) {
        toast.success("Settings updated successfully");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update settings");
      }
    } catch (error) {
      toast.error("An error occurred while updating settings");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Reload the page to reset all changes
    window.location.reload();
  };

  if (loadingData) {
    return (
      <AdminLayout activePage="settings">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading settings...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout activePage="settings">
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Server Settings</h1>
          <p className="text-gray-600">Manage your application configuration and settings</p>
        </div>

        <div className="space-y-6">
          {/* General Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
                <p className="text-sm text-gray-600">Basic application configuration</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="webName" className="text-sm font-medium text-gray-700">
                  Website Name
                </Label>
                <Input
                  id="webName"
                  value={config.webName}
                  onChange={(e) => setConfig({ ...config, webName: e.target.value })}
                  placeholder="Enter website name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sidebarTitle" className="text-sm font-medium text-gray-700">
                  Sidebar Title
                </Label>
                <Input
                  id="sidebarTitle"
                  value={config.sidebarTitle}
                  onChange={(e) => setConfig({ ...config, sidebarTitle: e.target.value })}
                  placeholder="Enter sidebar title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="sidebarLogoUrl" className="text-sm font-medium text-gray-700">
                  Sidebar Logo URL
                </Label>
                <Input
                  id="sidebarLogoUrl"
                  value={config.sidebarLogoUrl}
                  onChange={(e) => setConfig({ ...config, sidebarLogoUrl: e.target.value })}
                  placeholder="Enter logo URL"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Registration Open</Label>
                  <p className="text-xs text-gray-500 mt-1">Allow new user registrations through Auth Bot</p>
                </div>
                <Switch
                  checked={config.registrationOpen}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({
                      ...prev,
                      registrationOpen: checked,
                      isDirectLoginOpen: checked ? false : prev.isDirectLoginOpen,
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Direct Login Open</Label>
                  <p className="text-xs text-gray-500 mt-1">Allow direct login without auth from Bot!</p>
                </div>
                <Switch
                  checked={config.isDirectLoginOpen}
                  onCheckedChange={(checked) =>
                    setConfig((prev) => ({
                      ...prev,
                      isDirectLoginOpen: checked,
                      registrationOpen: checked ? false : prev.registrationOpen,
                    }))
                  }
                />
              </div>
            </div>
          </Card>

          {/* Telegram Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Telegram Settings</h2>
                <p className="text-sm text-gray-600">Configure Telegram bot and channel settings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="tg_bot" className="text-sm font-medium text-gray-700">
                  Bot Username
                </Label>
                <Input
                  id="tg_bot"
                  value={config.tg_bot}
                  onChange={(e) => setConfig({ ...config, tg_bot: e.target.value })}
                  placeholder="Enter bot username (with @)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="tg_channel" className="text-sm font-medium text-gray-700">
                  Channel URL
                </Label>
                <Input
                  id="tg_channel"
                  value={config.tg_channel}
                  onChange={(e) => setConfig({ ...config, tg_channel: e.target.value })}
                  placeholder="https://t.me/your_channel"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="tg_username" className="text-sm font-medium text-gray-700">
                  Telegram Username
                </Label>
                <Input
                  id="tg_username"
                  value={config.tg_username}
                  onChange={(e) => setConfig({ ...config, tg_username: e.target.value })}
                  placeholder="username (without @)"
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {loading ? "Saving..." : "Save Settings"}
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Changes
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 