import express from 'express';
import { dailyReport, summaryReport } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';
const router = express.Router();

router.use(protect);
router.get('/daily', permit('admin','manager'), dailyReport);
router.get('/summary', permit('admin','manager'), summaryReport);

export default router;
