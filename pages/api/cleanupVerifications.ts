// pages/api/trigger-cleanup.ts
import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import Verification from "@/models/Verification";

let lastCleanupTime = 0; // Timestamp in ms
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const now = Date.now();

  if (now - lastCleanupTime < CLEANUP_INTERVAL) {
    return res.status(200).json({ status: "skipped", reason: "recent cleanup already done" });
  }

  lastCleanupTime = now;

  await dbConnect();

  const result = await Verification.updateMany(
    {},
    {
      $pull: {
        verifiedBatch: { expireAt: { $lte: new Date() } }
      }
    }
  );

  return res.status(200).json({ status: "cleaned", modified: result.modifiedCount });
}
