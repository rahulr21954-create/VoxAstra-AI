
import VoiceAnalysis from "../models/VoiceAnalysis.js";
import fs from "fs";
import { spawn } from "child_process";
import path from "path";
import FraudAlert from "../models/FraudAlert.js";

// ==========================================
// UPLOAD VOICE
// ==========================================

export const uploadVoice = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Voice file is required"
            });
        }

        const analysis = await VoiceAnalysis.create({
            user: req.user.userId,
            filename: req.file.filename,
            filePath: req.file.path,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            status: "uploaded",
            verdict: "unknown"
        });

        return res.status(201).json({
            success: true,
            message: "Voice uploaded successfully",
            analysis: {
                id: analysis._id,
                filename: analysis.filename,
                status: analysis.status,
                verdict: analysis.verdict,
                createdAt: analysis.createdAt
            }
        });
    } catch (error) {
        console.error("VOICE UPLOAD ERROR:", error);

        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({
            success: false,
            message: "Voice upload failed"
        });
    }
};

// ==========================================
// GET VOICE ANALYSES
// ==========================================

export const getVoiceAnalyses = async (req, res) => {
    try {
        const analyses = await VoiceAnalysis
            .find({ user: req.user.userId })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: analyses.length,
            analyses
        });
    } catch (error) {
        console.error("GET VOICE ANALYSES ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// ==========================================
// ANALYZE VOICE
// ==========================================

export const analyzeVoice = async (req, res) => {
    try {
        const analysis = await VoiceAnalysis.findOne({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!analysis) {
            return res.status(404).json({
                success: false,
                message: "Voice analysis not found"
            });
        }

        if (analysis.status === "processing") {
            return res.status(409).json({
                success: false,
                message: "This voice is already being analyzed"
            });
        }

        analysis.status = "processing";
        await analysis.save();

        // ----------------------------------
        // AUDIO PROCESSOR
        // ----------------------------------

        const processorPath = path.resolve(
            "audio-processor",
            "processor.py"
        );

        const pythonProcess = spawn("python", [
            processorPath,
            analysis.filePath
        ]);

        let output = "";
        let errorOutput = "";

        pythonProcess.stdout.on("data", (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on("error", async (error) => {
            console.error("PYTHON SPAWN ERROR:", error);

            analysis.status = "failed";
            await analysis.save();

            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: "Could not start Python audio processor"
                });
            }
        });

        pythonProcess.on("close", async (code) => {
            try {
                if (code !== 0) {
                    console.error("PYTHON PROCESS ERROR:", errorOutput);

                    analysis.status = "failed";
                    await analysis.save();

                    return res.status(500).json({
                        success: false,
                        message: "Audio processing failed"
                    });
                }

                // ----------------------------------
                // PARSE AUDIO FEATURES
                // ----------------------------------

                const result = JSON.parse(output);

                if (!result.success) {
                    analysis.status = "failed";
                    await analysis.save();

                    return res.status(500).json({
                        success: false,
                        message: result.message || "Audio processing failed"
                    });
                }

                analysis.audioFeatures = result.audio;

                // ----------------------------------
                // ML PREDICTION
                // ----------------------------------

                const mlScriptPath = path.resolve(
                    "..",
                    "ml",
                    "scripts",
                    "predict_voice.py"
                );

                const mlProcess = spawn("python", [
                    mlScriptPath,
                    analysis.filePath
                ]);

                let mlOutput = "";
                let mlError = "";

                mlProcess.stdout.on("data", (data) => {
                    mlOutput += data.toString();
                });

                mlProcess.stderr.on("data", (data) => {
                    mlError += data.toString();
                });

                mlProcess.on("error", async (error) => {
                    console.error("ML SPAWN ERROR:", error);

                    analysis.status = "failed";
                    await analysis.save();

                    if (!res.headersSent) {
                        res.status(500).json({
                            success: false,
                            message: "Could not start ML prediction"
                        });
                    }
                });

                mlProcess.on("close", async (mlCode) => {
                    try {
                        if (mlCode !== 0) {
                            console.error("ML PROCESS ERROR:", mlError);

                            analysis.status = "failed";
                            await analysis.save();

                            return res.status(500).json({
                                success: false,
                                message: "ML prediction failed"
                            });
                        }

                        // ----------------------------------
                        // PARSE ML RESULT
                        // ----------------------------------

                        const mlResult = JSON.parse(mlOutput);

                        if (!mlResult.success || !mlResult.result) {
                            analysis.status = "failed";
                            await analysis.save();

                            return res.status(500).json({
                                success: false,
                                message: mlResult.message || "Invalid ML result"
                            });
                        }

                        const prediction = mlResult.result;
                        const riskScore = Number(prediction.riskScore);
                        const verdict = prediction.verdict;

                        if (
                            !Number.isFinite(riskScore) ||
                            riskScore < 0 ||
                            riskScore > 100 ||
                            !["legitimate", "suspicious", "fraud"].includes(verdict)
                        ) {
                            analysis.status = "failed";
                            await analysis.save();

                            return res.status(500).json({
                                success: false,
                                message: "ML returned an invalid risk score or verdict"
                            });
                        }

                        // ----------------------------------
                        // SAVE PREDICTION
                        // ----------------------------------

                        analysis.riskScore = riskScore;
                        analysis.verdict = verdict;
                        analysis.status = "completed";

                        await analysis.save();

                        // ----------------------------------
                        // FRAUD ALERT GENERATION
                        // IMPORTANT: Keep this INSIDE
                        // the ML close callback.
                        // ----------------------------------

                        let alert = null;

                        if (
                            verdict === "suspicious" ||
                            verdict === "fraud"
                        ) {
                            let severity;
                            let reason;
                            let recommendedAction;

                            if (riskScore >= 85) {
                                severity = "critical";

                                reason =
                                    "Very high probability of synthetic or cloned voice detected.";

                                recommendedAction =
                                    "Pause high-value transaction and require secondary authentication.";
                            } else if (riskScore >= 75) {
                                severity = "high";

                                reason =
                                    "High probability of synthetic or cloned voice detected.";

                                recommendedAction =
                                    "Require secondary authentication before approving the transaction.";
                            } else {
                                severity = "medium";

                                reason =
                                    "Voice characteristics show suspicious synthetic-voice patterns.";

                                recommendedAction =
                                    "Perform additional verification before proceeding.";
                            }

                            alert = await FraudAlert.create({
                                user: req.user.userId,
                                voiceAnalysis: analysis._id,
                                riskScore,
                                severity,
                                reason,
                                recommendedAction
                            });
                        }

                        // ----------------------------------
                        // FINAL RESPONSE
                        // ----------------------------------

                        return res.status(200).json({
                            success: true,
                            message: "Voice analyzed successfully",
                            analysis: {
                                id: analysis._id,
                                filename: analysis.filename,
                                status: analysis.status,
                                riskScore: analysis.riskScore,
                                verdict: analysis.verdict,
                                audioFeatures: analysis.audioFeatures
                            },
                            alertCreated: Boolean(alert)
                        });
                    } catch (error) {
                        console.error("ML OUTPUT ERROR:", error);

                        if (analysis.status === "processing") {
                            analysis.status = "failed";
                            await analysis.save();
                        }

                        if (!res.headersSent) {
                            return res.status(500).json({
                                success: false,
                                message: "ML prediction or fraud alert processing failed"
                            });
                        }
                    }
                });
            } catch (error) {
                console.error("AUDIO OUTPUT ERROR:", error);

                analysis.status = "failed";
                await analysis.save();

                if (!res.headersSent) {
                    return res.status(500).json({
                        success: false,
                        message: "Invalid audio processor response"
                    });
                }
            }
        });
    } catch (error) {
        console.error("ANALYZE VOICE ERROR:", error);

        if (!res.headersSent) {
            return res.status(500).json({
                success: false,
                message: "Voice analysis failed"
            });
        }
    }
};
