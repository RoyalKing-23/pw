import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import { authenticateUser, clearAuthCookies } from "@/utils/authenticateUser";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { name, page = "1" } = req.query;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ message: "Missing or invalid `name` query" });
  }

  const limit = 10;
  const currentPage = parseInt(page as string, 10);
  const skip = (currentPage - 1) * limit;

  try {
    const user = await authenticateUser(req, res);

    const query = {
      batchName: { $regex: name, $options: "i" }, // case-insensitive partial match
    };

    const totalItems = await Batch.countDocuments(query);
    const batches = await Batch.find(query).skip(skip).limit(limit).lean();

    return res.status(200).json({
      success: true,
      data: batches,
      currentPage,
      totalPages: Math.ceil(totalItems / limit),
      totalItems,
    });
  } catch (error) {
    console.error("Database search error:", error);
    return res.status(500).json({ message: "Error While Searching Batches" });
  }
}
