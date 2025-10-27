import express from "express";
import { getAllTaxLogs } from "../controllers/taxLogController.js";
import { protect } from "../middleware/authMiddleware.js";
import { permit } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/",   getAllTaxLogs);

export default router;
