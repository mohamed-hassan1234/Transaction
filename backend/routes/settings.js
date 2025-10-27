import express from 'express';
import { getSetting, upsertSetting, getSettings } from '../controllers/settingsController.js';
import { protect } from '../middleware/authMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';

const router = express.Router();

// GET all settings
router.get('/', protect, permit('admin','manager','cashier'), getSettings);

// GET specific setting
router.get('/:key', protect, permit('admin','manager','cashier'), getSetting);

// UPDATE setting
router.put('/:key', protect, permit('admin','manager',"cashier"), upsertSetting);

export default router;