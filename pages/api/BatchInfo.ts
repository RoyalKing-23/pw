import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getHeaders } from "@/utils/auth";
import { authenticateUser, clearAuthCookies } from "@/utils/authenticateUser"; // 👈 auth util

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { BatchId, Type, page } = req.query;

  if (!BatchId || !Type) {
    return res.status(400).json({ message: "Missing Required Payloads" });
  }

  const typeStr = String(Type);
  const pageNum = page ? Number(page) : 1;

  if (page && (isNaN(pageNum) || pageNum < 1)) {
    return res.status(400).json({ message: "Invalid page number" });
  }

  const typeMap: Record<string, string> = {
    details: "v3",
    announcement: "v1",
  };

  if (!(typeStr in typeMap)) {
    return res.status(400).json({ message: "Invalid Type parameter" });
  }

  const apiVersion = typeMap[typeStr];
  const PW_API = process.env.PW_API;
  let url = `${PW_API}/${apiVersion}/batches/${BatchId}/${typeStr}`;

  if (typeStr === "announcement") {
    url += `?page=${pageNum}`;
  }

  try {
    // 🔒 Enforce auth from HTTP-only cookie
    const user = await authenticateUser(req, res);
    let ActualToken = user.ActualToken;

    const response = await axios.get(url, { headers: getHeaders(ActualToken ?? "") });
    return res.status(200).json(response.data);
  } catch (error: any) {

    const status = error.response?.status || 500;

    // 🚨 Handle 401 from downstream API
    if (status === 401) {
      clearAuthCookies(res);
    }

    return res.status(status).json({
      message: error.response?.data?.message || "Error fetching batches Details",
    });
  }
}
