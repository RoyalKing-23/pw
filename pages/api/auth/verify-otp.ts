// /api/auth/verify-otp.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Batch from "@/models/Batch";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import ServerConfig from "@/models/ServerConfig";
import crypto from "crypto";

// Telegram
const TELEGRAM_BOT_TOKEN = process.env.BOT_TOKEN!;
const TELEGRAM_CHANNEL_ID = process.env.LOG_CHANNEL_ID!;
const BASE_URL = process.env.PW_API;

async function sendTelegramLog(message: string) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHANNEL_ID,
        text: message,
        parse_mode: "Markdown",
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));
  } catch (err: any) {
    console.error("Failed to send Telegram log:", err);
  }
}

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_ACCESS_EXPIRES_SECONDS = Number(process.env.JWT_ACCESS_EXPIRES_SECONDS || 3600);
const JWT_REFRESH_EXPIRES_DAYS = Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 30);
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
  err?: any;
  data?: any;
};

function normalizePhoneNumber(phone: string): string {
  phone = phone.trim().replace(/[^\d+]/g, "");
  return phone.startsWith("+") ? phone : "+91" + phone;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { phoneNumber, otp } = req.body;
  if (!phoneNumber || !otp) {
    return res.status(400).json({ success: false, message: "Phone number and OTP are required" });
  }

  try {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    await dbConnect();

    const config = await ServerConfig.findById(1);
    const isDirectLogin = config?.isDirectLoginOpen ?? false;

    let user = await User.findOne({ phoneNumber: normalizedPhone });
    if (!isDirectLogin && !user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const response = await fetch(`${BASE_URL}/v3/oauth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Randomid: randomId,
        Referer: "https://www.pw.live/",
        Origin: "https://www.pw.live/",
        "client-id": "5eb393ee95fab7468a79d189",
        "client-type": "WEB",
        "client-version": "2.1.1",
        priority: "u=1, i",
        accept: "application/json, text/plain, */*",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
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

    const body = await response.json();
    if (!response.ok || !body.success || !body.data) {
      return res.status(401).json({ success: false, message: "OTP verification failed!", data: body });
    }

    if (!user && isDirectLogin) {
      const last4Digits = normalizedPhone.slice(-4);
      user = await User.create({
        UserName: body.data.user.firstName + " " + body.data.user.lastName || `User_${last4Digits}`,
        phoneNumber: normalizedPhone,
        telegramId: null,
        photoUrl: body.data.user.imageId?.baseUrl && body.data.user.imageId?.key
          ? body.data.user.imageId.baseUrl + body.data.user.imageId.key
          : "https://cdn-icons-png.flaticon.com/512/3607/3607444.png",
        tag: "user",
        tagExpiry: null,
        hasLoggedIn: false,
        enrolledBatches: [],
      });
    }

    const realAccessToken = body.data.access_token;
    const realRefreshToken = body.data.refresh_token;

    user!.ActualToken = realAccessToken;
    user!.ActualRefresh = realRefreshToken;
    user!.randomId = randomId;
    user!.hasLoggedIn = true;
    await user!.save();

    // Optimised Batch Sync
    const fetchBatchPage = async (token: string, type: string, page: number) => {
      try {
        const controller = new AbortController();
        const tId = setTimeout(() => controller.abort(), 5000);
        const resBatch = await fetch(
          `${BASE_URL}/batch-service/v1/batches/purchased-batches?page=${page}&type=ALL&amount=${type}`,
          {
            method: "GET",
            headers: {
              accept: "application/json, text/plain, */*",
              authorization: `Bearer ${token}`,
              "client-id": "5eb393ee95fab7468a79d189",
              "client-type": "WEB",
              "client-version": "1.1.1",
              randomid: uuidv4(),
            },
            signal: controller.signal,
          }
        ).finally(() => clearTimeout(tId));
        const resData = await resBatch.json();
        return resData.success && Array.isArray(resData.data) ? resData.data.map((i: any) => i.batch || i) : [];
      } catch (err) {
        return [];
      }
    };

    const [paidBatches, freeBatches] = await Promise.all([
      fetchBatchPage(realAccessToken, "paid", 1),
      fetchBatchPage(realAccessToken, "free", 1)
    ]);

    const purchasedBatches = Array.from(new Map([...paidBatches, ...freeBatches].map(i => [i._id, i])).values());
    const { getBatchInfo } = await import("@/lib/batch");

    const batchesToSync = purchasedBatches.slice(0, 10);
    await Promise.all(batchesToSync.map(async (batch) => {
      try {
        const batchDetails = await getBatchInfo(batch._id, "details");
        const batchDoc = {
          batchId: batch._id,
          batchName: batchDetails?.name || batch.name || "Unknown Batch",
          batchPrice: batchDetails?.fee?.total || 0,
          batchImage: batchDetails?.iosPreviewImageUrl || (batch.previewImage?.baseUrl + batch.previewImage?.key) || "",
          template: batchDetails?.template || "NORMAL",
          BatchType: (batchDetails?.fee?.total || 0) > 0 ? "PAID" : "FREE",
          language: batchDetails?.language || "English",
          byName: batchDetails?.byName || "Unknown",
          startDate: batchDetails?.startDate || new Date().toISOString(),
          endDate: batchDetails?.endDate || new Date().toISOString(),
          batchStatus: true,
        };
        const enrolledToken = {
          ownerId: user!._id,
          accessToken: realAccessToken,
          refreshToken: realRefreshToken,
          tokenStatus: true,
          randomId,
          updatedAt: new Date(),
        };
        const existingBatch = await Batch.findOne({ batchId: batch._id });
        if (!existingBatch) {
          await Batch.create({ ...batchDoc, enrolledTokens: [enrolledToken] });
        } else {
          const tIdx = existingBatch.enrolledTokens.findIndex((t: any) => t.ownerId.toString() === user!._id.toString());
          if (tIdx !== -1) {
            existingBatch.enrolledTokens[tIdx] = enrolledToken;
          } else {
            existingBatch.enrolledTokens.push(enrolledToken);
          }
          Object.assign(existingBatch, batchDoc);
          await existingBatch.save();
        }
      } catch (err) {
        console.error(`Sync error for ${batch._id}:`, err);
      }
    }));

    const updateResult = await Batch.updateMany(
      { "enrolledTokens.ownerId": user!._id },
      {
        $set: {
          "enrolledTokens.$[elem].accessToken": realAccessToken,
          "enrolledTokens.$[elem].refreshToken": realRefreshToken,
          "enrolledTokens.$[elem].updatedAt": new Date(),
          "enrolledTokens.$[elem].randomId": randomId,
          "enrolledTokens.$[elem].tokenStatus": true,
        },
      },
      { arrayFilters: [{ "elem.ownerId": user!._id }] }
    );

    const payload = { userId: user!._id, name: user!.UserName, telegramId: user!.telegramId, PhotoUrl: user!.photoUrl };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_SECONDS });

    let refreshToken = "";
    while (true) {
      refreshToken = crypto.randomBytes(64).toString("hex");
      if (!(await User.findOne({ refreshToken }))) break;
    }

    user!.refreshToken = refreshToken;
    await user!.save();

    const isProd = process.env.NODE_ENV === "production";
    const cookieSecurity = isProd ? "; SameSite=None; Secure" : "; SameSite=Lax";

    res.setHeader("Set-Cookie", [
      `accessToken=${accessToken}; Path=/; HttpOnly${cookieSecurity}; Max-Age=${60 * 60 * 24 * 15}`,
      `refreshToken=${refreshToken}; Path=/; HttpOnly${cookieSecurity}; Max-Age=${60 * 60 * 24 * JWT_REFRESH_EXPIRES_DAYS}`,
    ]);

    await sendTelegramLog(`✅ *OTP Login Verified for ${user!.UserName}*\n🔁 *Batches:* ${updateResult.modifiedCount}`);

    return res.status(200).json({
      success: true,
      message: "OTP verified",
      accessToken,
      refreshToken,
      user: {
        id: user!._id.toString(),
        name: user!.UserName,
        telegramId: user!.telegramId,
        photoUrl: user!.photoUrl,
      },
    });
  } catch (err: any) {
    console.error("OTP Verification Error:", err);
    return res.status(500).json({ success: false, message: "Server error", err });
  }
}
