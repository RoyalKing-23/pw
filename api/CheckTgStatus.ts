import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import { authenticateUser } from "@/utils/authenticateUser";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const user = await authenticateUser(req, res);

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    if (!user.telegramId) {
      return res.status(200).json({
        success: false,
        message: "Telegram not connected yet!",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Telegram is connected!",
    });
  } catch (err: any) {
    console.error("CheckTGStatus error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
}
