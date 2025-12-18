"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Contact, GraduationCap, Presentation, Send,BookOpenCheck } from "lucide-react";
import Image from "next/image";

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  sidebarTitle?: string;
  sidebarLogoUrl?: string;
  BookLibrary?: string;
  tgChannel?: string;
}

export function Sidebar({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  sidebarTitle,
  sidebarLogoUrl,
  BookLibrary,
  tgChannel,
}: SidebarProps) {
  const pathname = usePathname();

  const sidebarItems = [
    { icon: BookOpen, text: "Study", href: "/study/" },
    { icon: Presentation, text: "Batches", href: "/study/batches" },
    { icon: GraduationCap, text: "My Batches", href: "/study/mybatches" },
    { icon: Send, text: "Join Telegram", href: tgChannel || "" },
    { icon: BookOpenCheck, text: "Book Library", href: BookLibrary || "" },
    { icon: Contact, text: "Contact Us", href: "/contact" },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 xl:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`
    z-50 w-64 bg-background border-r shadow-md
    transform transition-transform duration-200 ease-in-out
    ${
      isMobileMenuOpen
        ? "fixed top-0 left-0 translate-x-0 h-full"
        : "fixed top-0 left-0 -translate-x-full h-full"
    }
    xl:sticky xl:top-0 xl:translate-x-0 xl:h-screen xl:z-auto
  `}
      >
        {/* Logo */}
        <div className="p-4 border-b sticky top-0 bg-background z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full dark:bg-foreground overflow-hidden">
            <Image
              src={sidebarLogoUrl || "/assets/img/logo.png"}
              alt={sidebarTitle || "SATISH ~ DEV"}
              width={40}
              height={40}
              priority={true}
            />
          </div>
          <span className="font-semibold">{sidebarTitle}</span>
          <GraduationCap />
        </div>

        {/* Navigation */}
        <nav className="p-2 space-y-2 overflow-y-auto h-[calc(100vh-5rem)]">
          {sidebarItems.map((item) => {
            let isActive = false;

            if (item.href === "/study/") {
              // Only active if pathname is exactly /study or /study/
              isActive = pathname === "/study" || pathname === "/study/";
            } else if (item.href === "/study/batches") {
              // Active if pathname starts with /study/batches
              isActive =
                pathname === "/study/batches" ||
                pathname?.startsWith("/study/batches/") || false;
            } else if (item.href === "/study/mybatches") {
              // Active if pathname starts with /study/mybatches
              isActive =
                pathname === "/study/mybatches" ||
                pathname?.startsWith("/study/mybatches/") || false;
            } else {
              // Exact match for other items
              isActive = pathname === item.href;
            }

            return (
              <Link key={item.text} href={item.href as string}>
                <div
                  className={`flex items-center text-foreground gap-3 px-4 py-3 rounded-lg cursor-pointer text-sm transition-colors duration-200 ${
                    isActive
                      ? "bg-foreground/90 !text-background"
                      : "hover:bg-foreground/20 text-background"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.text}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
