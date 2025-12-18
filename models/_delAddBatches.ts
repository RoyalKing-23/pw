import mongoose, { Document, Schema } from "mongoose";

export interface IBatches extends Document {
  BatchStatus: boolean;
  BatchId: number;
  BatchAuthToken: string | null;
  BatchRefreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const AddBatchesSchema = new Schema<IBatches>(
  {
    BatchStatus: { type: Boolean, required: true, default: true },
    BatchId: { type: Number, required: true, unique: true },
    BatchAuthToken: { type: String, default: null },
    BatchRefreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

const AddBatches =
  mongoose.models.AddBatches ||
  mongoose.model<IBatches>("Batches", AddBatchesSchema);

export default AddBatches;
