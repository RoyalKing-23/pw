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
    const { BatchId, SubjectId, PdfId } = req.query;

    // Validate required params first
    const errors: string[] = [];

    if (!BatchId) errors.push("`BatchId`");
    if (!SubjectId) errors.push("`SubjectId`");
    if (!PdfId) errors.push("`PdfId`");

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
    const topicIdStr = Array.isArray(PdfId) ? PdfId[0] : PdfId ?? "";

    const url =
      PW_API +
      `/v1/batches/${batchIdStr}/subject/${subjectIdStr}/schedule/${PdfId}/schedule-details`;
    //   https://api.penpencil.co/v1/batches/676e4dee1ec923bc192f38c9/subject/c-865224/schedule/684845e3ce9a26973819ddd9/schedule-details

    // Ensure ActualToken is a string to satisfy type requirements
    if (!ActualToken) {
      return res.status(401).json({ message: "Missing or invalid token" });
    }

    const response = await axios.get(url, {
      headers: getHeaders(ActualToken),
    });

    const attachment =
      response.data?.data?.homeworkIds?.[0]?.attachmentIds?.[0];


    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    return res.status(200).json({ data: attachment });
  } catch (error: any) {
    const status = error.response?.status || 500;

    // 🚨 Handle 401 from downstream API
    if (status === 401) {
      clearAuthCookies(res);
    }

    return res.status(status).json({
      message: error.response?.data?.message || "Error fetching Pdf",
    });
  }
}
