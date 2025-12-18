import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { authenticateUser, clearAuthCookies } from "@/utils/authenticateUser";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (err: any) {
      return res.status(400).json({ success: false, message: "Invalid JSON" });
    }
  }

  const { batchId } = body;

  if (!batchId) {
    return res.status(400).json({ success: false, message: "Missing batchId" });
  }

  try {
    await dbConnect();

    const user = await authenticateUser(req, res);

    const beforeCount = user.enrolledBatches.length;

    user.enrolledBatches = user.enrolledBatches.filter(
      (batch: any) => batch.batchId !== batchId
    );

    if (user.enrolledBatches.length === beforeCount) {
      return res.status(200).json({ success: true, message: "Batch not found or already removed" });
    }

    await user.save();

    return res.status(200).json({ success: true,message: "Batch unenrolled successfully" });
  } catch (err: any) {
    console.error("Unenroll error:", err);
    return res.status(500).json({ success: false,message: "Internal Server Error" });
  }
}
