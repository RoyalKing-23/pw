import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import ServerConfig from "@/models/ServerConfig";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await dbConnect();
    const config = await ServerConfig.findOne({ _id: 1 }).lean() as any;
    if (!config) {
      return res.status(404).json({ error: "Server config not found" });
    }
    const { sidebarLogoUrl, sidebarTitle, tg_channel, tg_username, isDirectLoginOpen, webName, tg_bot } = config;
    return res.status(200).json({
      webName,
      sidebarLogoUrl,
      sidebarTitle,
      tg_channel,
      tg_username,
      isDirectLoginOpen,
      tg_bot
    });
  } catch (error) {
    console.error("[serverInfo] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
