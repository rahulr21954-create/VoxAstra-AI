import mongoose from "mongoose";

const verificationChallengeSchema =
    new mongoose.Schema(
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

            transaction: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Transaction",
                required: true
            },

            transactionAmount: {
                type: Number,
                required: true
            },

            voiceAnalysis: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "VoiceAnalysis",
                required: true
            },

            otpHash: {
                type: String,
                required: true
            },

            attempts: {
                type: Number,
                default: 0
            },

            expiresAt: {
                type: Date,
                required: true
            },

            status: {
                type: String,
                enum: [
                    "pending",
                    "verified",
                    "expired",
                    "failed"
                ],
                default: "pending"
            }
        },
        {
            timestamps: true
        }
    );

const VerificationChallenge =
    mongoose.model(
        "VerificationChallenge",
        verificationChallengeSchema
    );

export default VerificationChallenge;