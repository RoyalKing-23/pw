import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import ServerConfig from "@/models/ServerConfig";

import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

type Data = { success: boolean; message: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  function normalizePhoneNumber(phone: string): string {
    phone = phone.trim().replace(/[^\d+]/g, ""); // keep digits and plus only
    if (!phone.startsWith("+")) {
      return "+91" + phone;
    }
    return phone;
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res
      .status(400)
      .json({ success: false, message: "Phone number is required" });
  }

  let normalizedPhone: string;

  try {
    normalizedPhone = normalizePhoneNumber(phoneNumber);
  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid phone number format" });
  }

  try {
    await dbConnect();
    // ✅ CHeck the server, is setup or not!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    const config = await ServerConfig.findById(1);

    if (!config) {
      return res
        .status(500)
        .json({ success: false, message: "Server configuration not Setup!" });
    }

    // ✅ If direct login is NOT enabled, validate user existence
    if (!config.isDirectLoginOpen) {
      const user = await User.findOne({ phoneNumber: normalizedPhone });
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "User not found!" });
      }
    }

    // Send OTP request to PenPencil
    const response = await fetch(
      "https://api.penpencil.co/v1/users/get-otp?smsType=0",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Randomid: "ccbcdb28-bf0a-4203-b547-a1afa4e82499",
        },
        body: JSON.stringify({
          username: phoneNumber,
          countryCode: "+91",
          organizationId: "5eb393ee95fab7468a79d189",
        }),
      }
    );

    if (response.status !== 201) {
      const errorData = await response.json().catch(() => null);

      // Check for specific known error
      if (
        errorData?.error?.message === "User does not exist" &&
        errorData?.errorFrom === "User Microservice"
      ) {
        return res.status(404).json({
          success: false,
          message: "This number is not registered on the real PW app.",
        });
      }

      // Fallback for other errors
      const errorMessage = errorData?.error?.message || "Failed to send OTP";
      const statusCode = errorData?.error?.status || response.status || 500;

      return res.status(statusCode).json({
        success: false,
        message: errorMessage,
      });
    }

    return res
      .status(200)
      .json({ success: true, message: "OTP sent successfully" });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
