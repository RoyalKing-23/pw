// pages/api/getEnrolledBatches.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateUser, clearAuthCookies } from "@/utils/authenticateUser";
import dbConnect from '@/lib/mongodb';
import UserModel from "@/models/User";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const authUser = await authenticateUser(req, res); // just decodes JWT
    await dbConnect(); // ensure DB connection

    const user: any = await UserModel.findById(authUser._id).lean().exec();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        userId: user._id,
        name: user.UserName,
        telegramId: user.telegramId,
        PhotoUrl: user.photoUrl,
        tag: user.tag ?? null,
      },
      enrolledBatches: user.enrolledBatches || [],
    });

  } catch (err: any) {
    return res.status(401).json({ message: err.message || "Unauthorized" });
  }
}
