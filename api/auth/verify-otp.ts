// /api/auth/verify-otp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Batch from "@/models/Batch";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import ServerConfig from "@/models/ServerConfig"; // at the top if not already imported

import crypto from "crypto";

// Telegram
const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN!;
const TELEGRAM_CHANNEL_ID = process.env.LOG_CHANNEL_ID!;
const BASE_URL = process.env.PW_API;
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

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_ACCESS_EXPIRES_SECONDS = Number(
  process.env.JWT_ACCESS_EXPIRES_SECONDS || 3600
); // default to 1 hour
if (isNaN(JWT_ACCESS_EXPIRES_SECONDS)) {
  throw new Error("Invalid JWT_ACCESS_EXPIRES_SECONDS environment variable");
}

const JWT_REFRESH_EXPIRES_DAYS = Number(process.env.JWT_REFRESH_EXPIRES_DAYS);
const randomId = uuidv4();

type UserData = {
  id: string;
  name: string;
  telegramId?: string;
  photoUrl?: string;
};

type Data = {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user?: UserData;
  err?: string;
  data?: string;
};
function normalizePhoneNumber(phone: string): string {
  phone = phone.trim().replace(/[^\d+]/g, "");
  return phone.startsWith("+") ? phone : "+91" + phone;
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Origin", "*"); // restrict in production
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    return res.status(400).json({
      success: false,
      message: "Phone number and OTP are required",
    });
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    await dbConnect();

    const config = await ServerConfig.findById(1);
    const isDirectLogin = config?.isDirectLoginOpen ?? false;

    let user = await User.findOne({ phoneNumber: normalizedPhone });

    if (!isDirectLogin) {
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
    }

    const response = await fetch(`${BASE_URL}/v3/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Randomid: randomId,
      },
      body: JSON.stringify({
        username: phoneNumber,
        otp: otp,
        client_id: "system-admin",
        client_secret: "KjPXuAVfC5xbmgreETNMaL7z",
        grant_type: "password",
        organizationId: "5eb393ee95fab7468a79d189",
        latitude: 0,
        longitude: 0,
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success || !data.data) {
      return res.status(401).json({
        success: false,
        message: "OTP verification failed!",
        data,
      });
    }
    // If user was not found earlier (and direct login is ON), create now
    if (!user && isDirectLogin) {
      user = await User.create({
        UserName: data.data.user.firstName + " " + data.data.user.lastName,
        phoneNumber: normalizedPhone,
        telegramId: null,
        photoUrl: data.data.user.imageId.baseUrl + data.data.user.imageId.key,
        tag: "user",
        tagExpiry: null,
        hasLoggedIn: false,
        enrolledBatches: [],
      });
    }

    const realAccessToken = data.data.access_token;
    const realRefreshToken = data.data.refresh_token;

    user.ActualToken = realAccessToken;
    user.ActualRefresh = realRefreshToken;
    user.randomId = randomId; // Make sure your User schema supports this field

    // --- Batch Sync Logic Start ---
    // Helper to fetch user's purchased batches from PenPencil
    async function fetchPurchasedBatches(accessToken: string) {
      const randomId = uuidv4();
      const response = await fetch(
        `${BASE_URL}/batch-service/v1/batches/purchased-batches?page=1&type=ALL&amount=paid`,
        {
          method: "GET",
          headers: {
            accept: "application/json, text/plain, */*",
            authorization: `Bearer ${accessToken}`,
            "client-id": "5eb393ee95fab7468a79d189",
            "client-type": "WEB",
            "client-version": "1.1.1",
            randomid: randomId,
          },
        }
      );
      const data = await response.json();
      if (!data.success || !Array.isArray(data.data)) return [];
      return data.data.map((item: any) => item.batch || item); // handle both direct and nested
    }

    // Helper to fetch batch details
    const { getBatchInfo } = await import("@/lib/batch");

    // Sync batches
    const purchasedBatches = await fetchPurchasedBatches(realAccessToken);
    for (const batch of purchasedBatches) {
      // Fetch batch details
      const batchDetails = await getBatchInfo(batch._id, "details");
      // Prepare batch doc fields
      const batchDoc = {
        batchId: batch._id,
        batchName: batchDetails?.name || batch.name || "Unknown Batch",
        batchPrice: batchDetails?.fee?.total || 0,
        batchImage:
          batchDetails?.iosPreviewImageUrl ||
          (batchDetails?.previewImage?.baseUrl &&
          batchDetails?.previewImage?.key
            ? batchDetails.previewImage.baseUrl + batchDetails.previewImage.key
            : ""),
        template: batchDetails?.template || "NORMAL",
        BatchType: "FREE", // always FREE as in pw_bot.js
        language: batchDetails?.language || "English",
        byName: batchDetails?.byName || "Unknown",
        startDate: batchDetails?.startDate || "",
        endDate: batchDetails?.endDate || "",
        batchStatus: !(batchDetails?.isBlocked || batch.isBlocked),
      };
      // Prepare enrolledToken
      const enrolledToken = {
        ownerId: user._id,
        accessToken: realAccessToken,
        refreshToken: realRefreshToken,
        tokenStatus: true,
        randomId,
        updatedAt: new Date(),
      };
      // Upsert batch
      const existingBatch = await Batch.findOne({ batchId: batch._id });
      if (!existingBatch) {
        // Create new batch with this token
        await Batch.create({ ...batchDoc, enrolledTokens: [enrolledToken] });
      } else {
        // Check if token for this user exists
        const tokenIdx = existingBatch.enrolledTokens.findIndex(
          (t: { ownerId: { toString: () => any } }) =>
            t.ownerId.toString() === user._id.toString()
        );
        if (tokenIdx !== -1) {
          // Update token
          existingBatch.enrolledTokens[tokenIdx] = enrolledToken;
        } else {
          // Add new token
          existingBatch.enrolledTokens.push(enrolledToken);
        }
        // Update batch doc fields
        Object.assign(existingBatch, batchDoc);
        await existingBatch.save();
      }
    }
    // --- Batch Sync Logic End ---

    const updateResult = await Batch.updateMany(
      { "enrolledTokens.ownerId": user._id },
      {
        $set: {
          "enrolledTokens.$[elem].accessToken": realAccessToken,
          "enrolledTokens.$[elem].refreshToken": realRefreshToken,
          "enrolledTokens.$[elem].updatedAt": new Date(),
          "enrolledTokens.$[elem].randomId": randomId,
          "enrolledTokens.$[elem].tokenStatus": true,
        },
      },
      {
        arrayFilters: [{ "elem.ownerId": user._id }],
      }
    );
    if (updateResult.matchedCount === 0) {
      console.warn("User has no enrolled batch tokens to update.");
      await sendTelegramLog(
        `⚠️ No batch tokens updated for ${user.UserName} (\`${user._id}\`)`
      );
    }

    if (!updateResult.acknowledged) {
      throw new Error("Failed to update batch tokens");
    }

    const payload = {
      userId: user._id,
      name: user.UserName,
      telegramId: user.telegramId,
      PhotoUrl: user.photoUrl,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_ACCESS_EXPIRES_SECONDS,
    });

    let refreshToken = "";
    while (true) {
      refreshToken = crypto.randomBytes(64).toString("hex");
      if (!(await User.findOne({ refreshToken }))) break;
    }

    user.refreshToken = refreshToken;
    if (!user.hasLoggedIn) user.hasLoggedIn = true;
    if (user.tag && user.tagExpiry) {
      const now = new Date();
      if (now > user.tagExpiry) {
        user.tag = "user";
        user.tagExpiry = null;
      }
    }

    await user.save();

    const isProd = process.env.NODE_ENV === "production";

    // Only use SameSite=None + Secure in production
    const cookieSecurity = isProd
      ? "; SameSite=None; Secure"
      : "; SameSite=Lax"; // Lax works safely for dev without warning

    res.setHeader("Set-Cookie", [
      `accessToken=${accessToken}; Path=/; HttpOnly${cookieSecurity}; Max-Age=${
        60 * 60 * 24 * 15
      }`,
      `refreshToken=${refreshToken}; Path=/; HttpOnly${cookieSecurity}; Max-Age=${
        60 * 60 * 24 * JWT_REFRESH_EXPIRES_DAYS
      }`,
    ]);

    const now = new Date().toLocaleString("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    await sendTelegramLog(`
✅ *OTP Login Verified for ${user.UserName || "Unknown User"}*

🗓 *Time:* ${now}
📱 *Phone:* ${normalizedPhone}
🧠 *User ID:* \`${user._id}\`
🔁 *Batches Updated:* ${updateResult.modifiedCount}
    `);

    return res.status(200).json({
      success: true,
      message: "OTP verified",
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.UserName,
        telegramId: user.telegramId,
        photoUrl: user.photoUrl,
      },
    });
  } catch (err: any) {
    console.error("OTP Verification Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", err });
  }
}
