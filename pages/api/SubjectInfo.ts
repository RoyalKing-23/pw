// pages/api/subjectInfo.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { authenticateUser, clearAuthCookies } from "@/utils/authenticateUser";
import { getHeaders } from "@/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Verify user token before proceeding
    const user = await authenticateUser(req, res);
    let ActualToken = user.ActualToken;

    const { BatchId, SubjectId } = req.query;
    const PW_API = process.env.PW_API;

    if (!BatchId || typeof BatchId !== "string") {
      return res
        .status(400)
        .json({ message: "Missing or invalid `BatchId` query" });
    }
    if (!SubjectId || typeof SubjectId !== "string") {
      return res
        .status(400)
        .json({ message: "Missing or invalid `SubjectId` query" });
    }
    const pageRaw = req.query.page;
    const pageStr = Array.isArray(pageRaw) ? pageRaw[0] : pageRaw;

    const pageNumber = parseInt(pageStr ?? "1", 10);
    const url =
      PW_API +
      `/v2/batches/${BatchId}/subject/${SubjectId}/topics?page=${pageNumber.toString()}`;

    const response = await axios.get(url, {
      headers: getHeaders(ActualToken),
    });

    return res.status(200).json({
      data: response.data?.data || [],
    });
  } catch (error: any) {
    const status = error.response?.status || 500;

    // 🚨 Handle 401 from downstream API
    if (status === 401) {
      clearAuthCookies(res);
    }

    return res.status(status).json({
      message: error.response?.data?.message || "Error fetching Subjects",
    });
  }
}
