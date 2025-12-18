import mongoose from "mongoose";

const verifiedBatchSchema = new mongoose.Schema({
  batchId: { type: String, default: null },
  expireAt: { type: Date, default: null }, // Should be in IST
  verifiedAt: { type: Date, default: null },
  verificationToken: { type: String, default: null },
}, { _id: false });

const verificationSchema = new mongoose.Schema({
  anon_id: { type: String, required: true, unique: true },
  iphash: { type: String },
  useragent: { type: String },
  verified: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
  expireAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), index: { expireAfterSeconds: 0 } },
  verifiedBatch: { type: [verifiedBatchSchema], default: [] },
});

// Pre-save hook to update expireAt logic for main doc
verificationSchema.pre("save", function (next) {
  if (this.verified === false) {
    this.expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  } else {
    this.expireAt = new Date("2999-12-31T23:59:59.999Z");
  }
  next();
});

// Manual cleanup for expired verifiedBatch subdocs (since MongoDB TTL doesn't work on subdocs)
verificationSchema.pre("save", function (next) {
  // Remove expired subdocs in-place (do not reassign the array)
  if (Array.isArray(this.verifiedBatch)) {
    const now = new Date();
    const nowIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    for (let i = this.verifiedBatch.length - 1; i >= 0; i--) {
      const batch = this.verifiedBatch[i];
      if (batch.expireAt) {
        const expireAtIST = new Date(batch.expireAt.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        if (expireAtIST <= nowIST) {
          this.verifiedBatch.pull(batch._id);
        }
      }
    }
  }
  next();
});

const Verification = mongoose.models.Verification || mongoose.model("Verification", verificationSchema);

export default Verification; 