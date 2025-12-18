import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import Batch from "@/models/Batch";
import jwt from "jsonwebtoken";

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        // 1. Authentication Check
        const token = req.cookies?.admin_token;
        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "changeme");
        if (!decoded || typeof decoded !== "object" || !decoded.admin) {
            return res.status(401).json({ message: "Invalid token" });
        }

        await dbConnect();

        // 2. Validate and Extract Data
        const {
            batchId,
            batchName,
            batchPrice,
            batchImage,
            template,
            language,
            byName,
            startDate,
            endDate,
            batchStatus,
            enrolledTokens,
        } = req.body;

        // Basic validation
        if (
            !batchId ||
            !batchName ||
            !batchPrice ||
            !language ||
            !byName ||
            !startDate ||
            !endDate
        ) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Check if batchId already exists
        const existingBatch = await Batch.findOne({ batchId });
        if (existingBatch) {
            return res.status(400).json({ message: "Batch ID already exists" });
        }

        // 3. Create new Batch
        const newBatch = new Batch({
            batchId,
            batchName,
            batchPrice,
            batchImage,
            template: template || "NORMAL",
            language,
            byName,
            startDate,
            endDate,
            batchStatus: batchStatus !== undefined ? batchStatus : true,
            enrolledTokens: enrolledTokens || [],
            BatchType: batchPrice > 0 ? "PAID" : "FREE", // Auto-determine type
        });

        await newBatch.save();

        return res.status(201).json({
            message: "Batch created successfully",
            batch: newBatch,
        });
    } catch (error: any) {
        console.error("Error creating batch:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
}
