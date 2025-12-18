import dbConnect from "@/lib/mongodb";
import ServerConfig from "@/models/ServerConfig";

export async function getAllServerConfigs() {
  await dbConnect();
  const configs = await ServerConfig.find({}).lean();
  return configs;
} 