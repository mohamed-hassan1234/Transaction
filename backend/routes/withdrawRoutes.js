import express from "express";
import {
  createWithdraw,
  getWithdraws,
  getWithdraw,
  getWithdrawStats
} from "../controllers/withdrawController.js";
import { protect } from "../middleware/authMiddleware.js";
import { permit } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, permit("admin", "manager", "cashier"), createWithdraw);
router.get("/", protect, permit("admin", "manager", "cashier"), getWithdraws);
router.get("/stats", protect, permit("admin", "manager", "cashier"), getWithdrawStats);
router.get("/:id", protect, permit("admin", "manager", "cashier"), getWithdraw);

export default router;