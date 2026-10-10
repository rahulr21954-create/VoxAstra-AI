
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";

const transactionSchema = new mongoose.Schema(
    {
        transactionId: {
            type: String,
            unique: true,
            required: true,
            immutable: true,
            default: () => `TXN-${randomUUID()}`
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        type: {
            type: String,
            enum: ["credit", "debit"],
            required: true
        },

        category: {
            type: String,
            default: "other"
        },

        description: {
            type: String,
            default: ""
        },

        paymentMethod: {
            type: String,
            enum: ["cash", "upi", "card", "bank", "other"],
            default: "other"
        },

        voiceAnalysis: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "VoiceAnalysis",
            default: null
        },

        riskScore: {
            type: Number,
            min: 0,
            max: 100,
            default: null
        },

        securityDecision: {
            type: String,
            enum: ["allow", "verify", "block"],
            default: "allow"
        },

        verificationStatus: {
            type: String,
            enum: ["not_required", "pending", "verified", "failed"],
            default: "not_required"
        },

        status: {
            type: String,
            enum: ["pending", "completed", "blocked", "cancelled"],
            default: "pending"
        }
    },
    {
        timestamps: true
    }
);

const Transaction = mongoose.model(
    "Transaction",
    transactionSchema
);

export default Transaction;
