import dbConnect from "@/lib/mongodb";
import Verification from "@/models/Verification";

export default async function handler(req: any, res: any) {
  // Only allow POST method for security
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { anon_id, batchId } = req.body;
  if (!anon_id) return res.status(400).json({ error: "anon_id is required" });

  await dbConnect();
  const doc = await Verification.findOne({ anon_id });
  
  // Set security headers to prevent caching and logging
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  if (!doc) {
    return res.status(200).json({ verified: false });
  }

  // If batchId is provided, check if that specific batch is verified
  if (batchId) {
    const isVerified = doc.verifiedBatch?.some((vb: any) => vb.batchId === batchId) || false;
    return res.status(200).json({ verified: isVerified });
  }

  // Return minimal data - just the batch IDs that are verified, not the full tokens
  const verifiedBatchIds = doc.verifiedBatch?.map((vb: any) => vb.batchId) || [];
  return res.status(200).json({ 
    verified: doc.verified,
    verifiedBatchIds: verifiedBatchIds
  });
} 