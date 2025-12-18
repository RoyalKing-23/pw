"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, 
  Users, 
  Layers, 
  Settings, 
  LogOut, 
  Info, 
  User,
  ChevronDown,
  Menu,
  X,
  Link
} from "lucide-react";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
  activePage?: string;
}

export default function AdminLayout({ children, activePage = "dashboard" }: AdminLayoutProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin/logout", {
        method: "POST", // must match the API method
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Logged out successfully");
        router.replace("/admin/login");
      } else {
        toast.error(data.message || "Logout failed");
      }
    } catch (error) {
      toast.error("An error occurred during logout");
      console.error("Logout error:", error);
    }
  };

  const handleProfileClick = () => {
    router.push("/admin/profile");
    setShowProfileMenu(false);
  };

  const handleDashboardClick = () => {
    router.push("/admin/dashboard");
    setShowMobileSidebar(false);
  };

  const handleNavClick = (page: string) => {
    setShowMobileSidebar(false);
    if (page === "settings") {
      router.push("/admin/settings");
    } else if (page === "shortner") {
      router.push("/admin/shortner");
    } else if (page === "users") {
      router.push("/admin/users");
    } else if (page === "batches") {
      router.push("/admin/batches");
    }
    // Add navigation logic for other pages when implemented
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
        showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Admin</span>
          </div>
          <button
            onClick={() => setShowMobileSidebar(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <NavItem 
            icon={<Home className="w-5 h-5" />} 
            label="Dashboard" 
            active={activePage === "dashboard"}
            onClick={handleDashboardClick}
          />
          <NavItem 
            icon={<Users className="w-5 h-5" />} 
            label="Users" 
            active={activePage === "users"}
            onClick={() => handleNavClick("users")}
          />
          <NavItem 
            icon={<Layers className="w-5 h-5" />} 
            label="Batches" 
            active={activePage === "batches"}
            onClick={() => handleNavClick("batches")}
          />
          <NavItem 
            icon={<Settings className="w-5 h-5" />} 
            label="Settings" 
            active={activePage === "settings"}
            onClick={() => handleNavClick("settings")}
          />
          <NavItem 
            icon={<Link className="w-5 h-5" />} 
            label="Shortner" 
            active={activePage === "shortner"}
            onClick={() => handleNavClick("shortner")}
          />
        </nav>

        {/* Bottom Links */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button className="flex items-center gap-3 w-full px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Info className="w-4 h-4" />
            <span className="text-sm">Help & information</span>
          </button>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Log out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="font-bold text-xl text-gray-900">Admin</span>
              </div>
            </div>
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <User className="w-5 h-5" />
                <span className="text-sm font-medium hidden sm:block">Admin</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

function NavItem({ 
  icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
        active 
          ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
} 