import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Batch from "@/models/Batch";
import ServerConfig from "@/models/ServerConfig";
import jwt from "jsonwebtoken";
import { parse } from "cookie"; // ✅ FIXED

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

function verifyAdminTokenFromCookie(req: NextApiRequest) {
  const cookies = parse(req.headers.cookie || ""); // ✅ VPS MEIN YE ERROR AARHA THA
  const token = cookies.admin_token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "object" && decoded.admin) return decoded;
    return null;
  } catch {
    return null;
  }
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const admin = verifyAdminTokenFromCookie(req);
    if (!admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await dbConnect();

    const [userCount, batchCount, config] = await Promise.all([
      User.countDocuments(),
      Batch.countDocuments(),
      ServerConfig.findOne({ _id: 1 }).lean(),
    ]);

    return res.status(200).json({
      userCount,
      batchCount,
      serverConfig: config,
    });
  } catch (err) {
    console.error("[adminDashboard] Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
