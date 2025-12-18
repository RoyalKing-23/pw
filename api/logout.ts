import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateUser, clearAuthCookies } from "@/utils/authenticateUser";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    // Verify user before logout
    const user = await authenticateUser(req, res);

    // Clear cookies by setting empty values and expired dates
    res.setHeader("Set-Cookie", [
      `accessToken=; Path=/; HttpOnly; Max-Age=0; SameSite=None; Secure;`,
      `refreshToken=; Path=/; HttpOnly; Max-Age=0; SameSite=None; Secure;`,
    ]);

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err: any) {
    // If verification fails (unauthorized), just return 401
    return res.status(401).json({ message: "Unauthorized" });
  }
}
