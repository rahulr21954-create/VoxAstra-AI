import express from "express";

import {
    getFraudAlerts,
    updateFraudAlertStatus
} from "../controllers/fraudAlertController.js";

import {
    protect
} from "../middleware/authMiddleware.js";


const router = express.Router();


router.get(
    "/",
    protect,
    getFraudAlerts
);


router.patch(
    "/:id/status",
    protect,
    updateFraudAlertStatus
);


export default router;