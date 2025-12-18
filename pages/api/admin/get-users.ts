import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Batch from "@/models/Batch";
import jwt from "jsonwebtoken";
import axios from "axios";
import { getHeaders } from "@/utils/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    return handleGetUsers(req, res);
  } else if (req.method === "POST") {
    return handleCheckTokenStatus(req, res);
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}

async function handleGetUsers(req: NextApiRequest, res: NextApiResponse) {
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
          { UserName: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
          { telegramId: { $regex: search, $options: "i" } },
          { telegramName: { $regex: search, $options: "i" } },
          { telegramUsername: { $regex: search, $options: "i" } },
          {
            $expr: {
              $regexMatch: {
                input: { $ifNull: ["$tag", ""] },
                regex: search,
                options: "i",
              },
            },
          },
        ],
      };
    }

    const users = await User.find(searchQuery)
      .select("-refreshToken -ActualToken -ActualRefresh -randomId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalUsers = await User.countDocuments(searchQuery);

    // Get all batches with enrolled tokens for efficiency
    const allBatches = await Batch.find({
      "enrolledTokens.ownerId": { $in: users.map((user) => user._id) },
    })
      .select("batchId batchName enrolledTokens.ownerId")
      .lean();

    // Create a map of user ID to their batches
    const userBatchesMap = new Map();
    allBatches.forEach((batch) => {
      batch.enrolledTokens.forEach((token: any) => {
        const userId = token.ownerId.toString();
        if (!userBatchesMap.has(userId)) {
          userBatchesMap.set(userId, []);
        }
        userBatchesMap.get(userId).push({
          batchId: batch.batchId,
          batchName: batch.batchName,
        });
      });
    });

    // Map users to their batches
    const usersWithBatches = users.map((user) => {
      const userId =
        typeof user._id === "object" &&
        user._id !== null &&
        "toString" in user._id
          ? (user._id as any).toString()
          : String(user._id);
      return {
        ...user,
        batches: userBatchesMap.get(userId) || [],
      };
    });

    return res.status(200).json({
      users: usersWithBatches,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalUsers / limitNum),
        totalUsers,
        hasNextPage: pageNum * limitNum < totalUsers,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

async function handleCheckTokenStatus(
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

    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    await dbConnect();

    // Get user with access token
    const user = (await User.findById(userId)
      .select("ActualToken")
      .lean()) as any;
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.ActualToken) {
      return res.status(200).json({
        status: "no_token",
        message: "User has no access token",
      });
    }

    // Check token status using the same logic as get-user-details-list
    const PW_API = process.env.PW_API;
    const url = `${PW_API}/v1/users/user-profile-info?fields=cohortId,board`;
    // https://api.penpencil.co/v1/users/user-profile-info?fields=cohortId

    try {
      const response = await axios.get(url, {
        headers: getHeaders(user.ActualToken as string),
      });

      const responseData = response.data;

      if (responseData.success === true) {
        return res.status(200).json({
          status: "valid",
          message: "Token is valid",
        });
      }
    } catch (error: any) {
      const status = error.response?.status || 500;

      if (status === 401) {
        return res.status(200).json({
          status: "expired",
          message: "User token expired",
        });
      }

      return res.status(200).json({
        status: "error",
        message: error.response?.data?.message || "Error checking token status",
        error: error.response?.data || error.message,
      });
    }
  } catch (error: any) {
    console.error("Error checking token status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
