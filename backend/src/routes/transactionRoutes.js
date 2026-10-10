import express from "express";

import {
    createTransaction,
    getTransactions,
    evaluateTransaction
} from "../controllers/transactionController.js";

import {
    protect
} from "../middleware/authMiddleware.js";


const router = express.Router();


router.post(
    "/",
    protect,
    createTransaction
);


router.get(
    "/",
    protect,
    getTransactions
);


router.post(
    "/evaluate",
    protect,
    evaluateTransaction
);


export default router;