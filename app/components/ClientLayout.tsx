"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { jwtDecode } from "jwt-decode";

interface JwtPayload {
  exp: number; // expiry time in seconds since epoch
}
export default function ClientLayout({
  children,
  sidebarTitle,
  sidebarLogoUrl,
  BookLibrary,
  tgChannel,
}: {
  children: React.ReactNode;
  sidebarTitle?: string;
  sidebarLogoUrl?: string;
  BookLibrary?: string;
  tgChannel?: string;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-backgroud">
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        sidebarTitle={sidebarTitle}
        sidebarLogoUrl={sidebarLogoUrl}
        BookLibrary={BookLibrary}
        tgChannel={tgChannel}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
