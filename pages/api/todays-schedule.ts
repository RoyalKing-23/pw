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
    const { batchId } = req.body;

    // Validate required params first
    const errors: string[] = [];

    if (!batchId) errors.push("`batchId`");

    if (errors.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing or invalid: ${errors.join(", ")}` });
    }

    // Normalize all fields
    const batchIdStr = Array.isArray(batchId) ? batchId[0] : batchId ?? "";

    const url =
      PW_API +
      `/v1/batches/${batchIdStr}/todays-schedule?isNewStudyMaterialFlow=true`;
    // https://api.penpencil.co/v1/batches/67738e4a5787b05d8ec6e07f/todays-schedule?isNewStudyMaterialFlow=true

    const response = await axios.get(url, {
      headers: getHeaders(ActualToken || ""),
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
      message: error.response?.data?.message || "Error fetching Classes",
    });
  }
}
