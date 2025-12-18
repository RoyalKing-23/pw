// models/Batch.ts
import mongoose from "mongoose";

export interface IEnrolledToken {
  ownerId: mongoose.Types.ObjectId; // Reference to User who owns this token
  accessToken: string;
  refreshToken: string;
  tokenStatus: boolean;
  randomId?: string; // ✅ Add this

  updatedAt: Date;
}

export interface IBatch extends mongoose.Document {
  batchId: string;
  batchName: string;
  batchPrice: number;
  batchImage: string;
  template: string;
  BatchType: string;
  language: string;
  byName: string;
  startDate: string;
  endDate: string;
  batchStatus: boolean;

  enrolledTokens: IEnrolledToken[]; // <-- tokens per user here

  createdAt: Date;
  updatedAt: Date;
}

const enrolledTokenSchema = new mongoose.Schema<IEnrolledToken>(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    tokenStatus: { type: Boolean, default: true },
    randomId: { type: String }, // ✅ Add this

    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const batchSchema = new mongoose.Schema<IBatch>(
  {
    batchId: { type: String, required: true, unique: true },
    batchName: { type: String, required: true },
    batchPrice: { type: Number, required: true },
    batchImage: { type: String },
    template: { type: String, default: "NORMAL" },
    BatchType: {
      type: String,
      required: true,
      enum: ["FREE", "PAID"],
      default: "FREE",
    },
    language: { type: String, required: true },
    byName: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    batchStatus: { type: Boolean, required: true, default: true },

    enrolledTokens: { type: [enrolledTokenSchema], default: [] },
    // enrolledTokens: { type: [enrolledTokenSchema], default: [], select: false }, PENDING UPDATE TO ADD THIS TO HID ETHE TOKENS from any api............................

  },
  { timestamps: true }
);

const Batch =
  mongoose.models.Batch || mongoose.model<IBatch>("Batch", batchSchema);

export default Batch;
