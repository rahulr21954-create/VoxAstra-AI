
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import VoiceAnalysis from "../models/VoiceAnalysis.js";
import { evaluateTransactionRisk } from "../services/transactionSecurityService.js";

// ==========================================
// CREATE NORMAL TRANSACTION
// ==========================================

export const createTransaction = async (req, res) => {
    try {
        const {
            amount,
            type,
            category,
            description,
            paymentMethod,
        } = req.body ?? {};

        if (
            amount === undefined ||
            amount === null ||
            amount === "" ||
            type === undefined ||
            type === null ||
            type === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Amount and type are required",
            });
        }

        const numericAmount = Number(amount);

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Amount must be a positive number",
            });
        }

        if (!["credit", "debit"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Type must be credit or debit",
            });
        }

        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user not found",
            });
        }

        const transaction = await Transaction.create({
            user: req.user.userId,
            amount: numericAmount,
            type,
            category,
            description,
            paymentMethod,
            status: "completed",
        });

        return res.status(201).json({
            success: true,
            message: "Transaction created successfully",
            transaction,
        });
    } catch (error) {
        console.error("CREATE TRANSACTION ERROR:", error);

        if (error.name === "ValidationError" ||
            error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction data",
                error: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Server error while creating transaction",
        });
    }
};

// ==========================================
// GET TRANSACTIONS
// ==========================================

export const getTransactions = async (req, res) => {
    try {
        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user not found",
            });
        }

        const transactions = await Transaction.find({
            user: req.user.userId,
        })
            .populate("voiceAnalysis", "filename riskScore verdict")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: transactions.length,
            transactions,
        });
    } catch (error) {
        console.error("GET TRANSACTIONS ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching transactions",
        });
    }
};

// ==========================================
// EVALUATE PROTECTED TRANSACTION
// ==========================================

export const evaluateTransaction = async (req, res) => {
    try {
        const { amount, voiceAnalysisId } = req.body ?? {};

        if (
            amount === undefined ||
            amount === null ||
            amount === "" ||
            !voiceAnalysisId
        ) {
            return res.status(400).json({
                success: false,
                message: "Amount and voice analysis ID are required",
            });
        }

        const numericAmount = Number(amount);

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Amount must be a positive number",
            });
        }

        if (!mongoose.isValidObjectId(voiceAnalysisId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid voice analysis ID",
            });
        }

        if (!req.user?.userId) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user not found",
            });
        }

        const voiceAnalysis = await VoiceAnalysis.findOne({
            _id: voiceAnalysisId,
            user: req.user.userId,
        });

        if (!voiceAnalysis) {
            return res.status(404).json({
                success: false,
                message: "Voice analysis not found",
            });
        }

        if (voiceAnalysis.status !== "completed") {
            return res.status(400).json({
                success: false,
                message: "Voice analysis is not completed",
            });
        }

        const security = evaluateTransactionRisk({
            amount: numericAmount,
            voiceRiskScore: voiceAnalysis.riskScore,
            voiceVerdict: voiceAnalysis.verdict,
        });

        let transactionStatus;

        if (security.decision === "block") {
            transactionStatus = "blocked";
        } else if (security.decision === "verify") {
            transactionStatus = "pending";
        } else {
            transactionStatus = "completed";
        }

        const transaction = await Transaction.create({
            user: req.user.userId,
            amount: numericAmount,
            type: "debit",
            category: "protected-payment",
            description: "Voice protected transaction",
            paymentMethod: "other",
            voiceAnalysis: voiceAnalysis._id,
            riskScore: voiceAnalysis.riskScore,
            securityDecision: security.decision,
            verificationStatus: security.requiresSecondaryAuth
                ? "pending"
                : "not_required",
            status: transactionStatus,
        });

        return res.status(201).json({
            success: true,
            message: "Transaction security evaluated",
            transaction: {
                id: transaction._id,
                amount: transaction.amount,
                riskScore: transaction.riskScore,
                verdict: voiceAnalysis.verdict,
                securityDecision: transaction.securityDecision,
                verificationStatus: transaction.verificationStatus,
                status: transaction.status,
                reason: security.reason,
            },
        });
    } catch (error) {
        console.error("TRANSACTION SECURITY ERROR:", error);

        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction or voice analysis data",
                error: error.message,
            });
        }

        return res.status(500).json({
            success: false,
            message: "Transaction security evaluation failed",
        });
    }
};
