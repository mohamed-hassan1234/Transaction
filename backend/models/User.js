import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // bcrypt hash
  role: { type: String, enum: ['admin','cashier','manager'], default: 'cashier' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
