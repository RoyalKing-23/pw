import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import ServerConfig from "@/models/ServerConfig";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { parse } from "cookie"; // ✅ FIXED IMPORT

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

function verifyAdminTokenFromCookie(req: NextApiRequest) {
  const cookies = parse(req.headers.cookie || ""); // ✅ FIXED PARSE
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
  try {
    const admin = verifyAdminTokenFromCookie(req);
    if (!admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    await dbConnect();

    if (req.method === "GET") {
      const config = await ServerConfig.findOne({ _id: 1 }).lean();
      return res.status(200).json({ serverConfig: config });
    }

    if (req.method === "PUT") {
      const update: any = { ...req.body };

      // Hash password if provided
      if (update.password) {
        const salt = await bcrypt.genSalt(10);
        update.password = await bcrypt.hash(update.password, salt);
      } else {
        delete update.password;
      }

      // Sanitize update object
      delete update._id;
      delete update.__v;
      delete update.updatedAt;

      const config = await ServerConfig.findOneAndUpdate(
        { _id: 1 },
        { $set: update },
        { new: true, upsert: true }
      );

      return res.status(200).json({ serverConfig: config });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (err) {
    console.error("[serverConfig] Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
