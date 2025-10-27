import mongoose from 'mongoose';
const clientSchema = new mongoose.Schema({
  fullName: { type: String, required: true ,unique:true },
  phone: String,
  address: String,
  nationalId: { type: String, index: true },
  educationLevel: String,
  guarantor: { type: mongoose.Schema.Types.ObjectId, ref: 'Guarantor' },
  balance: { type: Number, default: 0 }, // optional running balance
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Client', clientSchema);
