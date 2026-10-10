import VoiceAnalysis from "../models/VoiceAnalysis.js";
import FraudAlert from "../models/FraudAlert.js";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";

const pythonCommand = process.env.PYTHON_BIN || "python3";

const processorPath = path.resolve(
    process.cwd(),
    "audio-processor",
    "processor.py"
);

const mlScriptPath = path.resolve(
    process.cwd(),
    "..",
    "ml",
    "scripts",
    "predict_voice.py"
);

const runPythonScript = (scriptPath, audioPath, label) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(scriptPath)) {
            return reject(
                new Error(`${label} script not found: ${scriptPath}`)
            );
        }

        if (!fs.existsSync(audioPath)) {
            return reject(
                new Error(`Audio file not found: ${audioPath}`)
            );
        }

        const pythonProcess = spawn(
            pythonCommand,
            [scriptPath, audioPath],
            { windowsHide: true }
        );

        let output = "";
        let errorOutput = "";

        pythonProcess.stdout.on("data", (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on("error", (error) => {
            reject(
                new Error(
                    `${label} could not start: ${error.message}`
                )
            );
        });

        pythonProcess.on("close", (code) => {
            if (code !== 0) {
                return reject(
                    new Error(
                        `${label} failed with exit code ${code}: ${
                            errorOutput.trim() ||
                            output.trim() ||
                            "Unknown Python error"
                        }`
                    )
                );
            }

            resolve(output.trim());
        });
    });
};

const parsePythonJson = (output, label) => {
    try {
        return JSON.parse(output);
    } catch {
        throw new Error(
            `${label} returned invalid JSON: ${output}`
        );
    }
};

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
            message: "Voice upload failed",
            details: error.message
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
            message: "Server error",
            details: error.message
        });
    }
};

// ==========================================
// ANALYZE VOICE
// ==========================================

export const analyzeVoice = async (req, res) => {
    let analysis;

    try {
        analysis = await VoiceAnalysis.findOne({
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

        const audioPath = path.isAbsolute(analysis.filePath)
            ? analysis.filePath
            : path.resolve(process.cwd(), analysis.filePath);

        console.log("CURRENT DIRECTORY:", process.cwd());
        console.log("PROCESSOR PATH:", processorPath);
        console.log("PROCESSOR EXISTS:", fs.existsSync(processorPath));
        console.log("ML SCRIPT PATH:", mlScriptPath);
        console.log("ML SCRIPT EXISTS:", fs.existsSync(mlScriptPath));
        console.log("AUDIO PATH:", audioPath);
        console.log("AUDIO EXISTS:", fs.existsSync(audioPath));

        // Audio processing
        const audioOutput = await runPythonScript(
            processorPath,
            audioPath,
            "Audio processor"
        );

        const audioResult = parsePythonJson(
            audioOutput,
            "Audio processor"
        );

        if (!audioResult.success) {
            throw new Error(
                audioResult.message || "Audio processing failed"
            );
        }

        analysis.audioFeatures = audioResult.audio;

        // ML prediction
        const mlOutput = await runPythonScript(
            mlScriptPath,
            audioPath,
            "ML prediction"
        );

        const mlResult = parsePythonJson(
            mlOutput,
            "ML prediction"
        );

        if (!mlResult.success || !mlResult.result) {
            throw new Error(
                mlResult.message || "Invalid ML result"
            );
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
            throw new Error(
                "ML returned an invalid risk score or verdict"
            );
        }

        analysis.riskScore = riskScore;
        analysis.verdict = verdict;
        analysis.status = "completed";

        await analysis.save();

        let alert = null;

        if (
            verdict === "suspicious" ||
            verdict === "fraud"
        ) {
            try {
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
            } catch (alertError) {
                console.error(
                    "FRAUD ALERT CREATION ERROR:",
                    alertError
                );
            }
        }

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
        console.error("ANALYZE VOICE ERROR:", error);

        if (analysis) {
            analysis.status = "failed";

            await analysis.save().catch((saveError) => {
                console.error(
                    "FAILED STATUS SAVE ERROR:",
                    saveError
                );
            });
        }

        return res.status(500).json({
            success: false,
            message: "Voice analysis failed",
            details: error.message
        });
    }
};