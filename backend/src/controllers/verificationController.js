import crypto from "crypto";
import mongoose from "mongoose";

import VerificationChallenge from "../models/VerificationChallenge.js";
import VoiceAnalysis from "../models/VoiceAnalysis.js";
import Transaction from "../models/Transaction.js";

import {
    evaluateTransactionRisk
} from "../services/transactionSecurityService.js";

const MAX_OTP_ATTEMPTS = 3;
const OTP_EXPIRY_MS = 5 * 60 * 1000;

// ==========================================
// FIND TRANSACTION BY OBJECTID OR CUSTOM ID
// ==========================================

const findUserTransaction = async (transactionId, userId) => {
    const id = String(transactionId || "").trim();

    if (!id) return null;

    // Search by MongoDB ObjectId.
    if (/^[a-fA-F0-9]{24}$/.test(id)) {
        const transaction = await Transaction.findOne({
            _id: id,
            user: userId
        });

        if (transaction) return transaction;
    }

    // Search only custom ID fields that exist in the schema.
    const possibleFields = [
        "transactionId",
        "txnId",
        "referenceId"
    ];

    for (const field of possibleFields) {
        if (!Transaction.schema.path(field)) continue;

        const transaction = await Transaction.findOne({
            [field]: id,
            user: userId
        });

        if (transaction) return transaction;
    }

    return null;
};

// ==========================================
// SHARED RISK EVALUATION
// ==========================================

const evaluateTransactionSecurity = (
    transaction,
    voiceAnalysis
) => {
    return evaluateTransactionRisk({
        amount: transaction.amount,
        voiceRiskScore: voiceAnalysis.riskScore,
        voiceVerdict: voiceAnalysis.verdict
    });
};

// ==========================================
// CREATE VERIFICATION CHALLENGE
// ==========================================

export const createVerification = async (req, res) => {
    try {
        const { transactionId } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (
            typeof transactionId !== "string" ||
            !transactionId.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Transaction ID is required"
            });
        }

        const transaction = await findUserTransaction(
            transactionId,
            userId
        );

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found. Check the transaction ID."
            });
        }

        if (transaction.status !== "pending") {
            return res.status(409).json({
                success: false,
                message: "Transaction is not pending",
                status: transaction.status
            });
        }

        if (!transaction.voiceAnalysis) {
            return res.status(400).json({
                success: false,
                message: "Transaction has no associated voice analysis"
            });
        }

        const voiceAnalysis = await VoiceAnalysis.findOne({
            _id: transaction.voiceAnalysis,
            user: userId
        });

        if (!voiceAnalysis) {
            return res.status(404).json({
                success: false,
                message: "Associated voice analysis not found"
            });
        }

        // Re-evaluate risk using the associated voice analysis.
        const security = evaluateTransactionSecurity(
            transaction,
            voiceAnalysis
        );

        // Do not bypass the security engine's decision.
        if (security.decision !== "verify") {
            return res.status(409).json({
                success: false,
                message: "Risk engine does not require secondary verification",
                decision: security.decision,
                transactionDecision: transaction.securityDecision
            });
        }

        // Saved decision and current decision must agree.
        if (transaction.securityDecision !== "verify") {
            return res.status(409).json({
                success: false,
                message: "Transaction security decision is outdated. Re-evaluate the transaction first.",
                decision: security.decision,
                transactionDecision: transaction.securityDecision
            });
        }

        // Avoid creating multiple active challenges.
        const existingChallenge = await VerificationChallenge.findOne({
            user: userId,
            transaction: transaction._id,
            status: "pending",
            expiresAt: { $gt: new Date() }
        });

        if (existingChallenge) {
            return res.status(200).json({
                success: true,
                message: "An active verification challenge already exists",
                challengeId: existingChallenge._id,
                expiresAt: existingChallenge.expiresAt
            });
        }

        // Generate a secure six-digit OTP.
        const otp = crypto.randomInt(100000, 1000000).toString();

        const otpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        const expiresAt = new Date(
            Date.now() + OTP_EXPIRY_MS
        );

        const challenge = await VerificationChallenge.create({
            user: userId,
            transaction: transaction._id,
            transactionAmount: transaction.amount,
            voiceAnalysis: voiceAnalysis._id,
            otpHash,
            expiresAt,
            attempts: 0,
            status: "pending"
        });

        return res.status(201).json({
            success: true,
            message: "Secondary verification challenge created",
            challengeId: challenge._id,
            expiresAt,
            ...(process.env.NODE_ENV !== "production"
                ? { demoOtp: otp }
                : {})
        });
    } catch (error) {
        console.error("CREATE VERIFICATION ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to create verification"
        });
    }
};

// ==========================================
// VERIFY OTP
// ==========================================

export const verifyOtp = async (req, res) => {
    try {
        const { challengeId, otp } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (
            typeof challengeId !== "string" ||
            !/^[a-fA-F0-9]{24}$/.test(challengeId) ||
            typeof otp !== "string" ||
            !/^\d{6}$/.test(otp)
        ) {
            return res.status(400).json({
                success: false,
                message: "Valid challenge ID and six-digit OTP are required"
            });
        }

        const challenge = await VerificationChallenge.findOne({
            _id: challengeId,
            user: userId
        });

        if (!challenge) {
            return res.status(404).json({
                success: false,
                message: "Verification challenge not found"
            });
        }

        if (challenge.status !== "pending") {
            return res.status(409).json({
                success: false,
                message: "Verification challenge is no longer active"
            });
        }

        // Expiration check.
        if (
            Date.now() >= new Date(challenge.expiresAt).getTime()
        ) {
            challenge.status = "expired";
            await challenge.save();

            return res.status(400).json({
                success: false,
                message: "OTP has expired. Create a new verification challenge."
            });
        }

        // Attempt limit.
        if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
            challenge.status = "failed";
            await challenge.save();

            return res.status(429).json({
                success: false,
                message: "Maximum OTP attempts exceeded"
            });
        }

        // Compare OTP hashes safely.
        const submittedHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest();

        const storedHash = Buffer.from(
            challenge.otpHash,
            "hex"
        );

        const otpMatches =
            storedHash.length === submittedHash.length &&
            crypto.timingSafeEqual(
                storedHash,
                submittedHash
            );

        if (!otpMatches) {
            challenge.attempts += 1;

            if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
                challenge.status = "failed";
            }

            await challenge.save();

            return res.status(
                challenge.status === "failed" ? 429 : 401
            ).json({
                success: false,
                message: challenge.status === "failed"
                    ? "Maximum OTP attempts exceeded"
                    : "Invalid OTP",
                attemptsRemaining: Math.max(
                    0,
                    MAX_OTP_ATTEMPTS - challenge.attempts
                )
            });
        }

        // ==========================================
        // OTP CORRECT: RECHECK TRANSACTION AND RISK
        // ==========================================

        const transaction = await Transaction.findOne({
            _id: challenge.transaction,
            user: userId
        });

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Associated transaction not found"
            });
        }

        if (
            transaction.status !== "pending" ||
            transaction.securityDecision !== "verify"
        ) {
            challenge.status = "failed";
            await challenge.save();

            return res.status(409).json({
                success: false,
                message: "Transaction is no longer awaiting verification",
                status: transaction.status,
                decision: transaction.securityDecision
            });
        }

        const voiceAnalysis = await VoiceAnalysis.findOne({
            _id: challenge.voiceAnalysis,
            user: userId
        });

        if (!voiceAnalysis) {
            return res.status(404).json({
                success: false,
                message: "Associated voice analysis not found"
            });
        }

        const security = evaluateTransactionSecurity(
            transaction,
            voiceAnalysis
        );

        if (security.decision !== "verify") {
            challenge.status = "failed";
            await challenge.save();

            return res.status(409).json({
                success: false,
                message: "Risk decision changed. Transaction was not completed.",
                decision: security.decision
            });
        }

        // Mark challenge verified and complete transaction.
        challenge.status = "verified";
        await challenge.save();

        transaction.verificationStatus = "verified";
        transaction.status = "completed";
        await transaction.save();

        return res.status(200).json({
            success: true,
            message: "Transaction verified successfully",
            transaction: {
                id: transaction._id,
                status: transaction.status,
                verificationStatus: transaction.verificationStatus
            }
        });
    } catch (error) {
        console.error("VERIFY OTP ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "OTP verification failed"
        });
    }
};
