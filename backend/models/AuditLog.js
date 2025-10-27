import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: String,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  targetCollection: String,
  targetId: mongoose.Schema.Types.ObjectId,
  ip: String,
  details: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('AuditLog', auditLogSchema);
