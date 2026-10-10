import express from "express";

import {
    getSecurityDashboard
} from "../controllers/dashboardController.js";

import {
    protect
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
    "/security",
    protect,
    getSecurityDashboard
);

export default router;