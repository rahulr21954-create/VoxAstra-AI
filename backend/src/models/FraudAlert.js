import mongoose from "mongoose";

const fraudAlertSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        voiceAnalysis: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "VoiceAnalysis",
            required: true
        },

        riskScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },

        severity: {
            type: String,
            enum: [
                "low",
                "medium",
                "high",
                "critical"
            ],
            required: true
        },

        reason: {
            type: String,
            required: true
        },

        recommendedAction: {
            type: String,
            required: true
        },

        status: {
            type: String,
            enum: [
                "open",
                "reviewed",
                "resolved"
            ],
            default: "open"
        }
    },
    {
        timestamps: true
    }
);

const FraudAlert = mongoose.model(
    "FraudAlert",
    fraudAlertSchema
);

export default FraudAlert;