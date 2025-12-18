// /pages/api/auth/resend-otp.ts
import { v4 as uuidv4 } from "uuid";
import { getHeaders } from "@/utils/auth";

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { phoneNumber } = req.body;
  const smsType = req.query.smsType || "0"; // default to SMS

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: "Missing phone number" });
  }

  try {
    const apiRes = await fetch(`https://api.penpencil.co/v1/users/resend-otp?smsType=${smsType}`, {
      method: "POST",
      headers: { ...getHeaders(""), "Content-Type": "application/json" },
      body: JSON.stringify({
        mobile: phoneNumber,
        organizationId: "5eb393ee95fab7468a79d189",
      }),
    });

    const data = await apiRes.json();

    if (!apiRes.ok || !data.success) {
      return res.status(apiRes.status).json({ success: false, message: "Failed to resend OTP" });
    }
    // Handle 400 Bad Request separately
    if (apiRes.status === 400) {
      return res.status(400).json({
        success: false,
        tryAgain: true, // <-- helpful flag for frontend
        message: data?.message || "Please Enter Your Number Again!.",
      });
    }
    return res.status(200).json({ success: true, dataFrom: data.dataFrom || "XMX_ER _API" });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}
