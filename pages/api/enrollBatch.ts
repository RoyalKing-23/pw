// pages/api/enrollBatch.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { authenticateUser, clearAuthCookies } from "@/utils/authenticateUser";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false,message: "Method not allowed" });
  }
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (err: any) {
      return res.status(400).json({ success: false,message: "Invalid JSON" });
    }
  }

  const { batchId, name } = body;

  if (!batchId || !name) {
    console.log("Received body:", req.body);
    return res.status(400).json({ success: false,message: "Missing batchId or name" });
  }

  try {
    await dbConnect();

    // Verify user from cookie (throws if invalid)
    const user = await authenticateUser(req, res);

    const alreadyEnrolled = user.enrolledBatches?.some(
      (batch: any) => batch.batchId === batchId
    );

    if (alreadyEnrolled) {
      return res
        .status(200)
        .json({ success: true,message: "Already enrolled in this batch" });
    }

    user.enrolledBatches.push({ batchId, name });
    await user.save();

    return res.status(200).json({ success: true,message: "Batch enrolled successfully" });
  } catch (err: any) {
    console.error("Enroll error:", err);
    return res.status(500).json({ success: false,message: "Internal Server Error" });
  }
}
