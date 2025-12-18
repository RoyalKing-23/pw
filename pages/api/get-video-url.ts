import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import Batch from "@/models/Batch";
import { getVideoHeaders } from "@/utils/auth";
import dbConnect from "@/lib/mongodb";
import { authenticateUser } from "@/utils/authenticateUser";
import User from "@/models/User";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { batchId, subjectId, childId } = req.query;

  try {
    const PW_API = process.env.PW_API;
    await dbConnect();

    const user = await authenticateUser(req, res);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!batchId || !subjectId || !childId) {
      return res.status(400).json({
        message: "`batchId`, `subjectId`, and `childId` are required",
      });
    }

    const batch = await Batch.findOne({ batchId });

    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const tokensToTry = [...batch.enrolledTokens];

    for (const token of tokensToTry) {
      if (!token.accessToken || !token.randomId) {
        continue;
      }

      try {
        const url = `${PW_API}/v1/videos/video-url-details?type=BATCHES&videoContainerType=DASH&reqType=query&childId=${childId}&parentId=${batchId}&clientVersion=201`;
        const headers = getVideoHeaders(token.accessToken, token.randomId);
        const response = await axios.get(url, { headers });

        return res.status(200).json(response.data);
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.warn(
            `Token for owner ${token.ownerId} failed for batch ${batchId}. Removing it.`
          );

          await Batch.updateOne(
            { _id: batch._id },
            {
              $pull: {
                enrolledTokens: { ownerId: token.ownerId },
              },
            }
          );

          if (token.ownerId) {
            await User.updateOne(
              { _id: token.ownerId },
              { $pull: { enrolledBatches: { batchId: String(batchId) } } }
            );
          }
          continue;
        } else {
          const status = error.response?.status || 500;
          return res.status(status).json({
            success: false,
            message:
              error.response?.data?.message ||
              error.message ||
              "Something went wrong",
          });
        }
      }
    }

    return res.status(403).json({
      success: false,
      message:
        "This Batch is unavailable. Please contact admin to add this batch.",
    });
  } catch (error: any) {
    console.error("Outer error in get-video-url:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An unexpected server error occurred",
    });
  }
}
