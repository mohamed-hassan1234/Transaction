import mongoose from 'mongoose';
const transactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['credit','debit'], required: true },
  amount: { type: Number, required: true }, // before tax
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true }, // amount + taxAmount
  date: { type: Date, default: Date.now },
  senderClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  receiverClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  externalName: String,
  receiptNumber: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending','completed','refunded'], default: 'completed' },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});
transactionSchema.index({ date: 1 });
export default mongoose.model('Transaction', transactionSchema);
