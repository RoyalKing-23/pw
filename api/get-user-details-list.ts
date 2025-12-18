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
    const { idsParam } = req.body;

    // Validate required params first
    const errors: string[] = [];

    if (!idsParam) errors.push("`idsParam`");

    if (errors.length > 0) {
      return res
        .status(400)
        .json({ message: `Missing or invalid: ${errors.join(", ")}` });
    }

    // Normalize all fields
const userIds = Array.isArray(idsParam) ? idsParam[0] : idsParam ?? "";

const url = `${PW_API}/v1/users/get-user-details-list?userIds=${userIds}`;

    // https://api.penpencil.co/v1/users/get-user-details-list?userIds=6842cc85450edb732a9dace0,660d1fd2ac956e001897762a

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
      message: error.response?.data?.message || "Error fetching Users",
    });
  }
}
