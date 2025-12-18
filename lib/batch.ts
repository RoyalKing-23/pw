import axios from "axios";

export async function getBatchInfo(batchId: string, type: string = "details") {
  if (!batchId) return null;
  const typeMap: Record<string, string> = {
    details: "v3",
    announcement: "v1",
  };
  if (!(type in typeMap)) return null;
  const apiVersion = typeMap[type];
  const PW_API = process.env.PW_API;
  if (!PW_API) throw new Error("PW_API env not set");
  let url = `${PW_API}/${apiVersion}/batches/${batchId}/${type}`;
  try {
    const response = await axios.get(url);
    return response.data?.data || null;
  } catch (err) {
    console.log("[getBatchInfo] Error:", err);
    return null;
  }
} 