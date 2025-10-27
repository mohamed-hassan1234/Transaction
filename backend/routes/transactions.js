// routes/transactionRoutes.js
import express from 'express';
import { createTransaction, getTransactions, getTransaction } from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js'; // ✅ import middleware

const router = express.Router();

// ✅ protect routes that require login
router.post('/', protect, createTransaction);
router.get('/', protect, getTransactions);
router.get('/:id', protect, getTransaction);

export default router;
