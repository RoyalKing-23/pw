import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import User from "@/models/User";
import { v4 as uuidv4 } from "uuid";

const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN;
const TELEGRAM_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

async function sendTelegramLog(message: string) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (err: any) {
    console.error("Failed to send Telegram log:", err);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await dbConnect();

    const batches = await Batch.find({ batchStatus: true });
    const tokenMap = new Map();

    // Step 1: Collect unique tokens by ownerId + refreshToken
    for (const batch of batches) {
      for (const token of batch.enrolledTokens) {
        if (!token.tokenStatus || !token.refreshToken) continue;

        const key = `${token.ownerId.toString()}:${token.refreshToken}`;

        if (!tokenMap.has(key)) {
          tokenMap.set(key, {
            ownerId: token.ownerId,
            refreshToken: token.refreshToken,
            affectedBatches: [batch._id],
          });
        } else {
          tokenMap.get(key).affectedBatches.push(batch._id);
        }
      }
    }

    // Step 2: Refresh each unique token once
    for (const [key, entry] of tokenMap.entries()) {
      const { ownerId, refreshToken, affectedBatches } = entry;
      const randomId = uuidv4(); // ✅ Generate randomId

      try {
        const response = await fetch(
          "https://api.penpencil.co/v3/oauth/refresh-token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Randomid: randomId, // ✅ Use in request
            },
            body: JSON.stringify({
              refresh_token: refreshToken,
              client_id: "system-admin",
            }),
          }
        );

        if (!response.ok) throw new Error("Refresh failed");

        const { data } = await response.json();
        const access = data.access_token;
        const refresh = data.refresh_token;

        // Step 3a: Update all matching tokens in batches
        await Batch.updateMany(
          {
            _id: { $in: affectedBatches },
            "enrolledTokens.ownerId": ownerId,
            "enrolledTokens.refreshToken": refreshToken,
          },
          {
            $set: {
              "enrolledTokens.$.accessToken": access,
              "enrolledTokens.$.refreshToken": refresh,
              "enrolledTokens.$.updatedAt": new Date(),
              "enrolledTokens.$.tokenStatus": true,
              "enrolledTokens.$.randomId": randomId, // ✅ Save randomId
            },
          }
        );

        // Step 3b: Update user's ActualToken
        await User.findByIdAndUpdate(ownerId, {
          ActualToken: access,
          ActualRefresh: refresh,
        });
      } catch (err: any) {
        console.error("Failed to refresh token for", ownerId, err);

        // ❌ Mark tokens inactive if refresh failed
        await Batch.updateMany(
          {
            _id: { $in: affectedBatches },
            "enrolledTokens.ownerId": ownerId,
            "enrolledTokens.refreshToken": refreshToken,
          },
          {
            $set: {
              "enrolledTokens.$.tokenStatus": false,
              "enrolledTokens.$.updatedAt": new Date(),
            },
          }
        );
      }
    }

    const updatedBatchesCount = batches.length;
    const updatedTokensCount = Array.from(tokenMap.values()).length;

    const now = new Date();
    const formattedDate = now.toLocaleString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const message = `
✅ *Batch Tokens Refreshed Successfully!*

🗓 *Date (IST):* ${formattedDate}\n
📦 *Batches Updated:* ${updatedBatchesCount}\n
🔑 *Tokens Refreshed:* ${updatedTokensCount}
`;

    await sendTelegramLog(message);

    return res.status(200).json({
      success: true,
      message: "Token refresh cycle complete.",
    });
  } catch (error) {
    console.error("Fatal refresh error:", error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error." });
  }
}
