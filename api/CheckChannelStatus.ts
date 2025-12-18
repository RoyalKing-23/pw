import type { NextApiRequest, NextApiResponse } from "next";
import { Telegraf } from "telegraf";
import dbConnect from "@/lib/mongodb";
import TgBot from "@/models/TgBot";

const BOT_TOKEN = process.env.BOT_TOKEN!;
const bot = new Telegraf(BOT_TOKEN);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const botConfig = await TgBot.findOne();
  if (!botConfig || !botConfig.channels) {
    return res.status(500).json({ success: false, message: "No bot channels configured." });
  }

  const joinChannels = botConfig.channels.filter((ch: any) => ch.channelType === "join");

  if (req.method === "GET") {
    const result: { channelLink: string; channelId: string | null }[] = [];

    for (const channel of joinChannels) {
      const channelLink: string = channel.channelLink;
      let chatId: string | null = null;

      try {
        let identifier = channelLink.replace("https://t.me/", "");
        if (!identifier.startsWith("+") && !identifier.startsWith("@")) {
          identifier = "@" + identifier;
        }

        const chat = await bot.telegram.getChat(identifier);
        chatId = chat.id?.toString() || null;
      } catch (err: any) {
        chatId = null;
      }

      result.push({ channelLink, channelId: chatId });
    }

    return res.status(200).json({ success: true, channels: result });
  }

  if (req.method === "POST") {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Missing userId" });
    }

    for (const channel of joinChannels) {
      const channelLink: string = channel.channelLink;

      let chatId: string | null = null;

      try {
        let identifier = channelLink.replace("https://t.me/", "");
        if (!identifier.startsWith("+") && !identifier.startsWith("@")) {
          identifier = "@" + identifier;
        }

        const chat = await bot.telegram.getChat(identifier);
        chatId = chat.id?.toString();
        if (!chatId) continue;

        const member = await bot.telegram.getChatMember(chatId, userId);
        const status = member.status;

        if (["member", "administrator", "creator"].includes(status)) {
          return res.status(200).json({ success: true, joined: true });
        }
      } catch (err: any) {
        continue;
      }
    }

    return res.status(200).json({ success: true, joined: false });
  }

  return res.status(405).json({ success: false, message: "Method Not Allowed" });
}
