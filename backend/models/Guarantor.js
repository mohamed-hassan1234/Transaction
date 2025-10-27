import mongoose from 'mongoose';
const guarantorSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: String,
  address: String,
  nationalId: String,
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model('Guarantor', guarantorSchema);
