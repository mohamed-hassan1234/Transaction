import Settings from '../models/Settings.js';
import AuditLog from '../models/AuditLog.js';

// GET a setting
export const getSetting = async (req, res) => {
  try {
    const key = req.params.key;
    let setting = await Settings.findOne({ key });
    
    if (!setting) {
      // Create default values for common settings
      const defaults = {
        taxRate: 0,
        withdraw_tax: 0,
        system_name: "Money Transfer System"
      };
      
      const value = defaults[key] !== undefined ? defaults[key] : 0;
      setting = await Settings.create({ key, value });
    }

    res.json(setting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch setting', error: err.message });
  }
};

// CREATE or UPDATE setting
export const upsertSetting = async (req, res) => {
  try {
    const key = req.params.key;
    const value = req.body.value;

    let setting = await Settings.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Audit log
    await AuditLog.create({
      action: 'update_setting',
      user: req.user?._id || null,
      targetCollection: 'Settings',
      targetId: setting._id,
      ip: req.ip,
      details: { key, value }
    });

    res.json(setting);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to upsert setting', error: err.message });
  }
};

// GET all settings
export const getSettings = async (req, res) => {
  try {
    const settings = await Settings.find();
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch settings', error: err.message });
  }
};