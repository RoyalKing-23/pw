// models/TokenManager.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export interface TokenManager extends Document {
  accessToken?: string | null;
  refreshToken?: string | null;
  tokenStatus: boolean;
  applicableBatches: Types.ObjectId[];      // storing batch IDs
  ownerId: Types.ObjectId | null;           // user ID or owner reference
  tokenType: "user" | "batch";               // type of token
  createdAt: Date;
  updatedAt: Date;
}

const tokenManagerSchema = new Schema<TokenManager>(
  {
    accessToken: { type: String, default: null },
    refreshToken: { type: String, default: null },
    tokenStatus: { type: Boolean, required: true, default: true },

    applicableBatches: [{ type: Schema.Types.ObjectId, ref: "Batch" }],

    // Reference to the user or entity who owns this token
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: false, default: null },

    // Token type to distinguish batch tokens from user tokens
    tokenType: { type: String, enum: ["user", "batch"], required: true },

  },
  { timestamps: true }
);

const TokenManagerModel =
  mongoose.models.TokenManager ||
  mongoose.model<TokenManager>("TokenManager", tokenManagerSchema);

export default TokenManagerModel;
