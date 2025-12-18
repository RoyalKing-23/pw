// File: /pages/api/admin/logout.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateUser, clearAuthCookies } from "@/utils/authenticateUser";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Clear cookies by setting them with expired Max-Age
    res.setHeader("Set-Cookie", [
      `admin_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax; Secure`,
    ]);

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err: any) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}