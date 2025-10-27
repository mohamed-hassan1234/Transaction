import express from 'express';
import { createClient, getClients, getClient, updateClient, updateClientBalance } from '../controllers/clientController.js';
import { protect } from '../middleware/authMiddleware.js';
import { permit } from '../middleware/roleMiddleware.js';

const router = express.Router();

// protect all routes
// router.use(protect);

router.get('/',  getClients);
router.post('/',  createClient); // POST route
router.get('/:id',  getClient);
router.put('/:id',  updateClient);
router.put('/balance/:id',  updateClientBalance); // Balance update

export default router;
