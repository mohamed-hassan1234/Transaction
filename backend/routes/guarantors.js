import express from 'express';
import { createGuarantor, getGuarantors } from '../controllers/guarantorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Protect route so req.user exists
router.post('/', protect, permit('admin','cashier'), createGuarantor);
router.get('/', protect, permit('admin','manager','cashier'), getGuarantors);

export default router;
