import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import axios from "axios";
import { getHeaders } from "@/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    return handleGetBatches(req, res);
  } else if (req.method === "POST") {
    return handleCheckActiveTokens(req, res);
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}

async function handleGetBatches(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Read token from cookie instead of Authorization header
    const token = req.cookies?.admin_token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Verify token (optional: decode and check claims)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "changeme");
    if (!decoded || typeof decoded !== "object" || !decoded.admin) {
      return res.status(401).json({ message: "Invalid token" });
    }

    await dbConnect();

    const { page = "1", limit = "10", search = "" } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { batchName: { $regex: search, $options: "i" } },
          { batchId: { $regex: search, $options: "i" } },
          { byName: { $regex: search, $options: "i" } },
          { language: { $regex: search, $options: "i" } },
        ],
      };
    }

    const batches = await Batch.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalBatches = await Batch.countDocuments(searchQuery);

    // Get user details for each enrolled token
    const batchesWithUsers = await Promise.all(
      batches.map(async (batch) => {
        const userIds = batch.enrolledTokens.map((token: any) => token.ownerId);
        const users = await User.find({ _id: { $in: userIds } })
          .select("UserName phoneNumber telegramId")
          .lean();

        // Create a map of user ID to user details
        const userMap = new Map();
        users.forEach((user: any) => {
          userMap.set(user._id.toString(), {
            _id: user._id,
            UserName: user.UserName,
            phoneNumber: user.phoneNumber,
            telegramId: user.telegramId,
          });
        });

        // Map enrolled tokens to user details
        const enrolledUsers = batch.enrolledTokens.map((token: any) => {
          const userId = token.ownerId.toString();
          const user = userMap.get(userId);
          return {
            _id: token.ownerId,
            UserName: user?.UserName || "Unknown User",
            phoneNumber: user?.phoneNumber || "N/A",
            telegramId: user?.telegramId,
            tokenStatus: token.tokenStatus || false,
            updatedAt: token.updatedAt,
          };
        });
        const { enrolledTokens, ...batchWithoutTokens } = batch;

        return {
          ...batchWithoutTokens,
          enrolledUsers,
        };
      })
    );

    return res.status(200).json({
      batches: batchesWithUsers,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalBatches / limitNum),
        totalBatches,
        hasNextPage: pageNum * limitNum < totalBatches,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching batches:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handleCheckActiveTokens(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Verify admin token
    const token = req.cookies?.admin_token;
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "changeme");
    if (!decoded || typeof decoded !== "object" || !decoded.admin) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const { batchId } = req.body;
    if (!batchId) {
      return res.status(400).json({ message: "Batch ID is required" });
    }

    await dbConnect();

    // Get batch with enrolled tokens
    const batch = await Batch.findOne({ batchId }).lean();
    if (!batch) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const PW_API = process.env.PW_API;
    let successCount = 0;
    let failedCount = 0;
    const results = [];

    // Check each enrolled token
    const enrolledTokens = ((batch as any).enrolledTokens as any[]) || [];
    for (const token of enrolledTokens) {
      if (!token.accessToken || !token.randomId) {
        failedCount++;
        results.push({
          userId: token.ownerId,
          status: "no_token",
          message: "No access token or random ID",
        });
        continue;
      }

      try {
        // Use the same logic as get-video-url.ts
        const url = `${PW_API}/v1/users/user-profile-info?fields=cohortId`;
        const headers = getHeaders(token.accessToken);
        const response = await axios.get(url, { headers });
        const responseData = response.data;

        if (responseData.success === true) {
          successCount++;
          results.push({
            userId: token.ownerId,
            status: "success",
            message: "Token is active",
          });
        }
      } catch (error: any) {
        failedCount++;
        results.push({
          userId: token.ownerId,
          status: "failed",
          message: error.response?.data?.message || "Token check failed",
        });
      }
    }

    return res.status(200).json({
      batchId,
      totalTokens: enrolledTokens.length,
      successCount,
      failedCount,
      results,
    });
  } catch (error: any) {
    console.error("Error checking active tokens:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
