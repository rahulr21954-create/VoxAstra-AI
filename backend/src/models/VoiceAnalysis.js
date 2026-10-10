import mongoose from "mongoose";

const voiceAnalysisSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        filename: {
            type: String,
            required: true
        },

        filePath: {
            type: String,
            required: true
        },

        mimeType: {
            type: String,
            required: true
        },

        fileSize: {
            type: Number,
            required: true
        },

        status: {
            type: String,
            enum: [
                "uploaded",
                "processing",
                "completed",
                "failed"
            ],
            default: "uploaded"
        },

        riskScore: {
            type: Number,
            default: null
        },

        verdict: {
            type: String,
            enum: [
                "unknown",
                "legitimate",
                "suspicious",
                "fraud"
            ],
            default: "unknown"
        },
        audioFeatures: {
    sampleRate: {
        type: Number,
        default: null
    },

    duration: {
        type: Number,
        default: null
    },

    mfcc: {
        type: [Number],
        default: []
    },

    zeroCrossingRate: {
        type: Number,
        default: null
    },

    rmsEnergy: {
        type: Number,
        default: null
    },

    spectralCentroid: {
        type: Number,
        default: null
    }
}
    },
    {
        timestamps: true
    }
);

const VoiceAnalysis = mongoose.model(
    "VoiceAnalysis",
    voiceAnalysisSchema
);

export default VoiceAnalysis;