// pages/api/subjectInfo.ts
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getHeaders } from "@/utils/auth";
import { authenticateUser, clearAuthCookies } from "@/utils/authenticateUser";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Verify user token before proceeding
    const user = await authenticateUser(req, res);
    let ActualToken = user.ActualToken;
    if (!ActualToken) {
      return res.status(401).json({ message: "PenPencil token missing. Please login again." });
    }
    const PW_API = process.env.PW_API;
    const { BatchId, SubjectId, TopicId, ContentType, page } = req.query;

    // Validate required params first
    const errors: string[] = [];

    if (!BatchId) errors.push("`BatchId`");
    if (!SubjectId) errors.push("`SubjectId`");
    if (!TopicId) errors.push("`TopicId`");
    if (!ContentType) errors.push("`ContentType`");

    if (errors.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing or invalid: ${errors.join(", ")}` });
    }

    // Normalize all fields
    const batchIdStr = Array.isArray(BatchId) ? BatchId[0] : BatchId ?? "";
    const subjectIdStr = Array.isArray(SubjectId)
      ? SubjectId[0]
      : SubjectId ?? "";
    const topicIdStr = Array.isArray(TopicId) ? TopicId[0] : TopicId ?? "";
    const contentTypeStr = Array.isArray(ContentType)
      ? ContentType[0]
      : ContentType ?? "";

    const pageStr = Array.isArray(page) ? page[0] : page;
    const pageNumber = parseInt(pageStr ?? "1", 10);

    const url =
      PW_API +
      `/v2/batches/${batchIdStr}/subject/${subjectIdStr}/contents?tag=${topicIdStr}&contentType=${contentTypeStr}&page=${pageNumber}`;

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
      message: error.response?.data?.message || "Error fetching Topics",
    });
  }
}
