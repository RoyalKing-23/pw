import dbConnect from "@/lib/mongodb";
import Verification from "@/models/Verification";
import ServerConfig from "@/models/ServerConfig";
import crypto from "crypto";
import KeyGenerateClient from "./KeyGenerateClient";
import { getBatchInfo } from "@/lib/batch";
import axios from "axios";
import { headers } from "next/headers";

import Batch from "@/models/Batch";
import { redirect } from "next/navigation";

function encryptToken(payload: object, secret: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash("sha256").update(secret).digest();
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(JSON.stringify(payload), "utf8", "base64");
  encrypted += cipher.final("base64");
  return `${iv.toString("base64")}:${encrypted}`;
}

export default async function KeyGeneratePage({ searchParams }: { searchParams?: Promise<{ [key: string]: string }> }) {
  const params = searchParams ? await searchParams : {};
  const anon_id = params.anon_id || "";
  const batchId = params.batchId || "";

  let iphash = "";
  let useragent = "";
  let token = "";
  let batchInfo = null;
  let batchName = "Batch";
  let batchImage = "";
  let shortnerServers: any[] = [];

  if (anon_id) {
    await dbConnect();
    const verification = await Verification.findOne({ anon_id });
    if (verification) {
      iphash = verification.iphash || "";
      useragent = verification.useragent || "";
      // Check if already verified for this batch
      const verifiedBatch = verification.verifiedBatch || [];
      const alreadyVerified = verifiedBatch.some((vb: any) => vb.batchId === batchId);
      if (alreadyVerified) {
        redirect(`/study/batches/${batchId}`);
      }
    }
  }

  if (batchId) {
    batchInfo = await getBatchInfo(batchId, "details");
    batchName = batchInfo?.name || "Batch";
    batchImage = batchInfo?.iosPreviewImageUrl || "";
    // Fallback: If iosPreviewImageUrl is not available, fetch from Batch collection
    if (!batchImage) {
      const batchDoc = await Batch.findOne({ batchId });
      if (batchDoc) {
        batchName = batchDoc.batchName || batchName;
        batchImage = batchDoc.batchImage || batchImage;
      }
    }
  }

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 10 * 60;
  const timestamp = new Date().toISOString();
  const redirectTo = `/study/batches/${batchId}`;

  const payload = {
    anon_id,
    batchid: batchId,
    iphash,
    useragent,
    iat,
    exp,
    timestamp,
    redirectTo,
  };

  const SECRET = process.env.SHORTNER_TOKEN_SECRET?.replace(/^"|"$/g, "");
  if (anon_id && batchId && iphash && useragent && SECRET) {
    token = encryptToken(payload, SECRET);
    // console.log("Token", `${encodeURIComponent(token)}`);
  }

  // Fetch enabled shortner servers from ServerConfig and generate short links
  await dbConnect();
  const config = await ServerConfig.findOne({ _id: 1 });
  if (config && Array.isArray(config.shortner_servers)) {
const headersList = await headers();
const host = headersList.get("host");
const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
const baseUrl = `${protocol}://${host}`;
 const verifyUrl = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;
    console.log("HOST: ", host, "Verify URL: ", verifyUrl);
    shortnerServers = await Promise.all(
      config.shortner_servers
        .filter((s: any) => s.enabled)
        .map(async (s: any) => {
          // Build the API URL 
          let apiUrl = s.api_url
            .replace("{api_key}", encodeURIComponent(s.api_key))
            .replace("{api}", encodeURIComponent(s.api_key))
            .replace("{url}", encodeURIComponent(verifyUrl));
          let shortenedUrl = "";
          console.log("apiUrl: ",apiUrl);
          try {
            const response = await axios.get(apiUrl);
            if (response.data && response.data.shortenedUrl) {
              shortenedUrl = response.data.shortenedUrl;
            }
          } catch (err) {
            // Optionally log error
            shortenedUrl = "";
          }
          return {
            name: s.name,
            api_url: s.api_url,
            api_key: s.api_key,
            _id: s._id?.toString?.() || undefined,
            shortenedUrl,
          };
        })
    );
    console.log(shortnerServers);
  }

  return (
    <KeyGenerateClient
      anon_id={anon_id}
      batchId={batchId}
      iphash={iphash}
      useragent={useragent}
      token={token}
      batchName={batchName}
      batchImage={batchImage}
      shortnerServers={shortnerServers}
    />
  );
} 
