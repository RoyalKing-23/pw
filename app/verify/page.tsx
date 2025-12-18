// app/verify/page.tsx
import crypto from "crypto";
import { Buffer } from "buffer";
import React from "react";
import dbConnect from "@/lib/mongodb";
import Verification from "@/models/Verification";
import { redirect } from "next/navigation";

// Helper to format UNIX timestamp to dd-mm-yyyy hh:mm:ss AM/PM
function formatTimestamp(unix: number): string {
  const date = new Date(unix * 1000);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  const formattedTime = `${String(hours).padStart(
    2,
    "0"
  )}:${minutes}:${seconds} ${ampm}`;
  return `${day}-${month}-${year} ${formattedTime}`;
}

function decryptToken(token: string, secret: string): any {
  try {
    const [ivBase64, encrypted] = token.split(":");

    if (!ivBase64 || !encrypted) throw new Error("Token format is invalid");

    const iv = Buffer.from(ivBase64, "base64");
    const key = crypto.createHash("sha256").update(secret).digest();

    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    const parsed = JSON.parse(decrypted);
    console.log("✅ Successfully decrypted token payload:", parsed);
    return parsed;
  } catch (err) {
    console.error(
      "❌ Decryption failed:",
      err instanceof Error ? err.message : err
    );
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string };
}) {
  const params = searchParams || {};
  const rawToken = searchParams?.token;
  if (!rawToken) {
    redirect("/study/batches?toast=Missing%20Token");
  }

  const token = decodeURIComponent(rawToken.replace(/ /g, "+"));

  const SECRET = process.env.SHORTNER_TOKEN_SECRET?.replace(/^"|"$/g, "");
  let payload = null;

  if (!SECRET) {
    redirect("/study/batches?toast=SECRET%20not%20found");
  }
  payload = decryptToken(token, SECRET);
  if (!payload) {
    redirect("/study/batches?toast=Token%20is%20invalid");
  }
  if (payload.error) {
    redirect(
      "/study/batches?toast=Invalid%20Verification%20Token.%20try%20again"
    );
  }

  // Check exp
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now >= payload.exp) {
    redirect(
      "/study/batches?toast=Verification%20had%20already%20Expired.%20Please%20try%20again"
    );
  }

  // Check anon_id in Verification
  await dbConnect();
  const verification = await Verification.findOne({ anon_id: payload.anon_id });
  if (!verification) {
    redirect(
      "/study/batches?toast=Unknown%20Anon%20ID.%20refresh%20page%20and%20try%20again"
    );
  }

  // Check if batchId already exists in verifiedBatch array
  const verifiedBatch = verification.verifiedBatch || [];
  const alreadyVerified = verifiedBatch.some(
    (vb: any) => vb.batchId === payload.batchid
  );
  if (alreadyVerified) {
    redirect(
      "/study/batches?toast=You%20have%20already%20verified%20this%20batch"
    );
  }

  // Insert new verification for this batch
  const nowDate = new Date();
  const expiredAt = new Date(nowDate.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now
  const newVerified = {
    batchId: payload.batchid,
    verificationToken: token,
    verifiedAt: nowDate,
    expiredAt,
  };
  await Verification.updateOne(
    { anon_id: payload.anon_id },
    { $push: { verifiedBatch: newVerified } }
  );

  // Optionally, you can set up a TTL index on expiredAt in MongoDB for auto-deletion

  redirect(
    `/study/batches/${payload.batchid}?toast=Hurray,%20You%20have%20verified%20successfully%20for%20this%20Batch.`
  );

  // Fallback UI (should never render)
  return null;
}
