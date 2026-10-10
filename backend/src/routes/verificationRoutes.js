import express from "express";

import {
    createVerification,
    verifyOtp
} from "../controllers/verificationController.js";

import {
    protect
} from "../middleware/authMiddleware.js";


const router = express.Router();


router.post(
    "/create",
    protect,
    createVerification
);


router.post(
    "/verify",
    protect,
    verifyOtp
);


export default router;