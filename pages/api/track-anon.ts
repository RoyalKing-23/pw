import type { NextApiRequest, NextApiResponse } from "next";
import dbConnect from "@/lib/mongodb";
import Verification from "@/models/Verification";
import crypto from "crypto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { anon_id, ip, useragent } = req.body;
  if (!anon_id || !useragent) {
    return res.status(400).json({ error: "Missing fields" });
  }

  // Use 'unknown' if ip is missing or empty
  const ipToHash = ip && typeof ip === 'string' && ip.trim() !== '' ? ip : 'unknown';
  const iphash = crypto.createHash("sha256").update(ipToHash).digest("hex");

  await dbConnect();
  const existing = await Verification.findOne({ anon_id });
  if (!existing) {
    await Verification.create({ anon_id, iphash, useragent, verified: false, timestamp: new Date() });
  } else if (existing.iphash !== iphash || existing.useragent !== useragent) {
    existing.iphash = iphash;
    existing.useragent = useragent;
    existing.timestamp = new Date();
    existing.verified = false;
    await existing.save();
  }
  // Respond with no sensitive data
  return res.status(204).end();
} 