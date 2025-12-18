import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import ServerConfig from "@/models/ServerConfig";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "devilboy@Supreme#Sattu@123_&^%$#@!1234567890";
const isProd = process.env.NODE_ENV === "production";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  await dbConnect();
  const config = await ServerConfig.findOne({ _id: 1 });
  if (!config || !config.username) {
    return res.status(401).json({ message: "Admin not configured" });
  }

  const isMatch = await bcrypt.compare(password, config.password);
  if (!isMatch || username !== config.username) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { admin: true, username: config.username },
    JWT_SECRET,
    { expiresIn: "2h" }
  );

  const cookieSecurity = isProd
    ? "; SameSite=None; Secure"
    : "; SameSite=Lax"; // for dev use

  res.setHeader("Set-Cookie", [
    `admin_token=${token}; Path=/; HttpOnly${cookieSecurity}; Max-Age=${60 * 60 * 2}`
  ]);

  return res.status(200).json({ success: true });
}
