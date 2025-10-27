import mongoose from "mongoose";

const withdrawSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  amount: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },     // e.g. 5 = 5%
  taxAmount: { type: Number, default: 0 },   // amount * taxRate / 100
  totalReceived: { type: Number, default: 0 }, // amount - taxAmount (what client actually receives)
  date: { type: Date, default: Date.now },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

withdrawSchema.index({ date: 1 });

export default mongoose.model("Withdraw", withdrawSchema);