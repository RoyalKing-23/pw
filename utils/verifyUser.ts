// utils/verifyUser.ts
import { NextApiRequest } from "next";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET!;

export const verifyUser = async (req: NextApiRequest) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new Error("Unauthorized: No token provided");
  }

  try {
    // Connect to DB if not already connected
    await dbConnect();

    const decoded: any = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new Error("User not found");
    }

    return user; // Return full user document
  } catch (err: any) {
    console.error("Token verification failed:", err);
    throw new Error("Unauthorized: Invalid or expired token");
  }
};
