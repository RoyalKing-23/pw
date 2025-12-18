import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import ClientLayout from "../components/ClientLayout";
import { getAllServerConfigs } from "@/lib/serverConfig";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const configs = await getAllServerConfigs();
  // Use the first config (assuming only one)
  const config = configs[0] || {};
  return (
    <ClientLayout 
      sidebarTitle={config.sidebarTitle} 
      sidebarLogoUrl={config.sidebarLogoUrl}
      BookLibrary={"https://power-x-library.netlify.app"}
      tgChannel={config.tg_channel}
    >
      {children}
    </ClientLayout>
  );
}
