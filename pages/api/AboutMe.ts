// pages/api/AboutMe.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateUser } from "@/utils/authenticateUser";
import dbConnect from '@/lib/mongodb';
import UserModel from "@/models/User";
import BatchModel from "@/models/Batch";
import { v4 as uuidv4 } from "uuid";

const BASE_URL = process.env.PW_API;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const authUser = await authenticateUser(req, res);
    await dbConnect();

    const user = await UserModel.findById(authUser._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- Batch Sync Logic Start (Lazy Load) ---
    // Only sync if user has an ActualToken and hasn't synced recently or has no batches
    const shouldSync = user.ActualToken && (!user.enrolledBatches || user.enrolledBatches.length === 0);

    if (shouldSync) {
      try {
        const { getBatchInfo } = await import("@/lib/batch");
        const realAccessToken = user.ActualToken!;
        const realRefreshToken = user.ActualRefresh!;
        const randomId = user.randomId || uuidv4();

        interface PWBatch {
          _id: string;
          name: string;
          fee?: {
            total: number;
          };
          iosPreviewImageUrl?: string;
          previewImage?: {
            baseUrl: string;
            key: string;
          };
          template?: string;
          language?: string;
          byName?: string;
          startDate?: string;
          endDate?: string;
        }

        // Helper to fetch batch pages
        const fetchBatchPage = async (token: string, type: string, page: number): Promise<PWBatch[]> => {
          try {
            const controller = new AbortController();
            const tId = setTimeout(() => controller.abort(), 5000);
            const resBatch = await fetch(
              `${BASE_URL}/batch-service/v1/batches/purchased-batches?page=${page}&type=ALL&amount=${type}`,
              {
                method: "GET",
                headers: {
                  accept: "application/json, text/plain, */*",
                  authorization: `Bearer ${token}`,
                  "client-id": "5eb393ee95fab7468a79d189",
                  "client-type": "WEB",
                  "client-version": "1.1.1",
                  randomid: uuidv4(),
                },
                signal: controller.signal,
              }
            ).finally(() => clearTimeout(tId));
            const rd = await resBatch.json();
            return rd.success && Array.isArray(rd.data) ? rd.data.map((i: any) => i.batch || i) : [];
          } catch (err) { return []; }
        };

        // Fetch only paid batches for automatic sync as requested
        const purchasedBatches = await fetchBatchPage(realAccessToken, "paid", 1);

        // Update user.enrolledBatches locally first
        user.enrolledBatches = purchasedBatches.map(b => ({ batchId: b._id, name: b.name }));

        // Parallelize batch sync (limit to 10 batches for speed)
        const batchesToSync = purchasedBatches.slice(0, 10);
        await Promise.all(batchesToSync.map(async (batch: PWBatch) => {
          try {
            const batchDetails = await getBatchInfo(batch._id, "details");
            const batchDoc = {
              batchId: batch._id,
              batchName: batchDetails?.name || batch.name || "Unknown Batch",
              batchPrice: batchDetails?.fee?.total || 0,
              batchImage: batchDetails?.iosPreviewImageUrl || (batch.previewImage ? `${batch.previewImage.baseUrl}${batch.previewImage.key}` : "") || "",
              template: batchDetails?.template || "NORMAL",
              BatchType: (batchDetails?.fee?.total || 0) > 0 ? "PAID" : "FREE",
              language: batchDetails?.language || "English",
              byName: batchDetails?.byName || "Unknown",
              startDate: batchDetails?.startDate || new Date().toISOString(),
              endDate: batchDetails?.endDate || new Date().toISOString(),
              batchStatus: true,
            };
            const enrolledToken = {
              ownerId: user._id,
              accessToken: realAccessToken,
              refreshToken: realRefreshToken,
              tokenStatus: true,
              randomId,
              updatedAt: new Date(),
            };
            const existingBatch = await BatchModel.findOne({ batchId: batch._id });
            if (!existingBatch) {
              await BatchModel.create({ ...batchDoc, enrolledTokens: [enrolledToken] });
            } else {
              const tIdx = existingBatch.enrolledTokens.findIndex((t: any) => t.ownerId.toString() === user._id.toString());
              if (tIdx !== -1) {
                existingBatch.enrolledTokens[tIdx] = enrolledToken;
              } else {
                existingBatch.enrolledTokens.push(enrolledToken);
              }
              Object.assign(existingBatch, batchDoc);
              await existingBatch.save();
            }
          } catch (err) { console.error(`Sync error:`, err); }
        }));

        await user.save();
      } catch (syncErr) {
        console.error("Background sync failed:", syncErr);
      }
    }
    // --- Batch Sync Logic End ---

    return res.status(200).json({
      success: true,
      user: {
        userId: user._id,
        name: user.UserName,
        telegramId: user.telegramId,
        PhotoUrl: user.photoUrl,
        tag: user.tag ?? null,
      },
      enrolledBatches: user.enrolledBatches || [],
    });

  } catch (err: any) {
    return res.status(401).json({ message: err.message || "Unauthorized" });
  }
}
