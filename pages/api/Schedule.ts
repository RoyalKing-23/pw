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
    const PW_API = process.env.PW_API;
    const { BatchId, SubjectId, ContentId } = req.query;

    // Validate required params first
    const errors: string[] = [];

    if (!BatchId) errors.push("`BatchId`");
    if (!SubjectId) errors.push("`SubjectId`");
    if (!ContentId) errors.push("`ContentId`");

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
    const topicIdStr = Array.isArray(ContentId)
      ? ContentId[0]
      : ContentId ?? "";

    const url =
      PW_API +
      `/v1/batches/${batchIdStr}/subject/${subjectIdStr}/schedule/${ContentId}/schedule-details`;
    //   https://api.penpencil.co/v1/batches/676e4dee1ec923bc192f38c9/subject/c-865224/schedule/684845e3ce9a26973819ddd9/schedule-details

    const response = await axios.get(url, {
      headers: getHeaders(ActualToken),
    });

    const data = response.data?.data;
    return res.status(200).json({ success:true, data });
  } catch (error: any) {
    const status = error.response?.status || 500;

    // 🚨 Handle 401 from downstream API
    if (status === 401) {
      clearAuthCookies(res);
    }

    return res.status(status).json({
      message: error.response?.data?.message || "Error fetching DataX",
    });
  }
}
