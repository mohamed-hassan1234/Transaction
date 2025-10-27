import Settings from '../models/Settings.js';

export async function generateReceiptNumber(session) {
  // Read prefix and increment counter atomically (within session if provided)
  const prefixDoc = await Settings.findOne({ key: 'receiptPrefix' }).session(session);
  const prefix = prefixDoc ? prefixDoc.value : 'RCPT';

  const counterDoc = await Settings.findOneAndUpdate(
    { key: 'receiptCounter' },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true, session }
  );

  const counter = counterDoc.value || 1;
  const now = new Date();
  const yyyyMM = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const padded = String(counter).padStart(6, '0');
  return `${prefix}${yyyyMM}-${padded}`;
}

export async function getSetting(key) {
  const s = await Settings.findOne({ key });
  return s ? s.value : null;
}
