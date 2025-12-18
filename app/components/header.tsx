"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sun,
  LogOut,
  Menu,
  User,
  GraduationCap,
  ChevronLeft,
  Moon,
  Computer,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { jwtDecode } from "jwt-decode";
interface JwtPayload {
  UserName?: string;
  name?: string;
  PhotoUrl?: string;
  [key: string]: any;
}

interface HeaderProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}
type Theme = "LIGHT" | "DARK" | "SYSTEM";

export function Header({ isMobileMenuOpen, setIsMobileMenuOpen }: HeaderProps) {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>("SYSTEM");

  const [user, setUser] = useState<{
    name?: string;
    telegramId?: string;
    photoUrl?: string;
  } | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("USER_THEME") as Theme | null;

    if (
      savedTheme === "LIGHT" ||
      savedTheme === "DARK" ||
      savedTheme === "SYSTEM"
    ) {
      setTheme(savedTheme);
    } else {
      // Not found or invalid, default remains SYSTEM
      localStorage.setItem("USER_THEME", "SYSTEM");
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const apply = (t: Theme) => {
      if (t === "DARK") {
        root.classList.add("dark");
      } else if (t === "LIGHT") {
        root.classList.remove("dark");
      } else {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        root.classList.toggle("dark", prefersDark);
      }
    };

    apply(theme);
    localStorage.setItem("USER_THEME", theme);

    if (theme === "SYSTEM") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        root.classList.toggle("dark", e.matches);
      };
      media.addEventListener("change", handler);
      return () => media.removeEventListener("change", handler);
    }
  }, [theme]);

  const handleLogout = async () => {
    try {
      // Call logout API to clear cookies server-side
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include", // important to send cookies
      });

      if (!res.ok) {
        throw new Error("Failed to logout");
      }

      // Clear localStorage client-side
      localStorage.clear();

      // Redirect to login or home page
      router.push("/auth");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  useEffect(() => {
    const storedUser = localStorage.getItem("USER_DATA");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser({
          name:
            parsedUser.name && parsedUser.name.trim() !== ""
              ? parsedUser.name
              : "There",
          telegramId: parsedUser.telegramId,
          photoUrl: parsedUser.photoUrl, // no fallback here
        });
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        setUser({
          name: "There",
          photoUrl: "",
        });
      }
    } else {
      setUser({
        name: "There",
        photoUrl: "",
      });
    }
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-background/50  backdrop-blur border-b p-2 sm:p-4 flex items-center justify-between divshadow">
      <div className="flex items-center gap-2 bg-background/50 rounded-lg sm:px-2 py-2 md:ml-0">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="xl:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-5 h-5" />
          Back
        </button>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="">
              {theme === "LIGHT" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={() => setTheme("LIGHT")}
              className="cursor-pointer"
            >
              <Sun className="mr-2 h-4 w-4" />
              <span>Light</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setTheme("DARK")}
              className="cursor-pointer"
            >
              <Moon className="mr-2 h-4 w-4" />
              <span>Dark</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setTheme("SYSTEM")}
              className="cursor-pointer"
            >
              <Computer className="mr-2 h-4 w-4" />
              <span>System</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <span className="hidden sm:inline truncate max-w-40 overflow-hidden text-ellipsis whitespace-nowrap">
          Hi, {user?.name}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar>
              <AvatarImage src={user?.photoUrl} />
              <AvatarFallback>
                {user?.name && user.name.length > 0
                  ? user.name.slice(0, 2).toUpperCase()
                  : "SR"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem
              onClick={handleLogout}
              className="
            cursor-pointer text-red-500"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
