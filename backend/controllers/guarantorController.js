import Guarantor from '../models/Guarantor.js';
import AuditLog from '../models/AuditLog.js';

export const createGuarantor = async (req, res) => {
  try {
    const g = new Guarantor(req.body);
    await g.save();

    // safeguard: haddii user login la' yahay
    const userId = req.user?._id || null;

    await AuditLog.create({
      action: 'create_guarantor',
      user: userId,
      targetCollection: 'Guarantor',
      targetId: g._id,
      ip: req.ip,
      details: { fullName: g.fullName }
    });

    res.status(201).json(g);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create guarantor', error: err.message });
  }
};

export const getGuarantors = async (req, res) => {
  try {
    const list = await Guarantor.find();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch guarantors', error: err.message });
  }
};
