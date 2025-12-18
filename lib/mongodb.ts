import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Emulate __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI in .env.local");
}

// Define a custom type for your cache object
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // Use the custom cache type, NOT typeof mongoose!
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache;
}

// Initialize cache or fallback
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;
  global.mongoose = cached; // Assign your cache object, not the mongoose module itself
  return cached.conn;
}
export default dbConnect;
