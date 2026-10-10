import Transaction from "../models/Transaction.js";
import VoiceAnalysis from "../models/VoiceAnalysis.js";
import FraudAlert from "../models/FraudAlert.js";

export const getSecurityDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;

        // -----------------------------
        // TRANSACTION COUNTS
        // -----------------------------

        const totalTransactions =
            await Transaction.countDocuments({
                user: userId
            });

        const completedTransactions =
            await Transaction.countDocuments({
                user: userId,
                status: "completed"
            });

        const pendingTransactions =
            await Transaction.countDocuments({
                user: userId,
                status: "pending"
            });

        const blockedTransactions =
            await Transaction.countDocuments({
                user: userId,
                status: "blocked"
            });

        const cancelledTransactions =
            await Transaction.countDocuments({
                user: userId,
                status: "cancelled"
            });

        const verifiedTransactions =
            await Transaction.countDocuments({
                user: userId,
                verificationStatus: "verified"
            });

        // -----------------------------
        // FRAUD ALERT COUNTS
        // -----------------------------

        const totalFraudAlerts =
            await FraudAlert.countDocuments({
                user: userId
            });

        const openFraudAlerts =
            await FraudAlert.countDocuments({
                user: userId,
                status: "open"
            });

        const highRiskAlerts =
            await FraudAlert.countDocuments({
                user: userId,
                severity: {
                    $in: ["high", "critical"]
                }
            });

        // -----------------------------
        // VOICE ANALYSIS COUNTS
        // -----------------------------

        const totalVoiceAnalyses =
            await VoiceAnalysis.countDocuments({
                user: userId
            });

        const legitimateVoiceCount =
            await VoiceAnalysis.countDocuments({
                user: userId,
                verdict: "legitimate"
            });

        const suspiciousVoiceCount =
            await VoiceAnalysis.countDocuments({
                user: userId,
                verdict: "suspicious"
            });

        const fraudVoiceCount =
            await VoiceAnalysis.countDocuments({
                user: userId,
                verdict: "fraud"
            });

        // -----------------------------
        // AVERAGE RISK SCORE
        // -----------------------------

        const riskAggregation =
            await VoiceAnalysis.aggregate([
                {
                    $match: {
                        user: userId,
                        riskScore: {
                            $ne: null
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        averageRiskScore: {
                            $avg: "$riskScore"
                        }
                    }
                }
            ]);

        const averageRiskScore =
            riskAggregation.length > 0
                ? Number(
                    riskAggregation[0]
                        .averageRiskScore
                ).toFixed(2)
                : 0;

        // -----------------------------
        // RECENT VOICE ANALYSES
        // -----------------------------

        const recentVoiceAnalyses =
            await VoiceAnalysis.find({
                user: userId
            })
                .select(
                    "filename riskScore verdict status createdAt"
                )
                .sort({
                    createdAt: -1
                })
                .limit(5);

        // -----------------------------
        // RECENT TRANSACTIONS
        // -----------------------------

        const recentTransactions =
            await Transaction.find({
                user: userId
            })
                .select(
                    "amount type riskScore securityDecision verificationStatus status createdAt"
                )
                .sort({
                    createdAt: -1
                })
                .limit(5);

        // -----------------------------
        // RECENT FRAUD ALERTS
        // -----------------------------

        const recentAlerts =
            await FraudAlert.find({
                user: userId
            })
                .populate(
                    "voiceAnalysis",
                    "filename riskScore verdict"
                )
                .select(
                    "riskScore severity reason recommendedAction status createdAt voiceAnalysis"
                )
                .sort({
                    createdAt: -1
                })
                .limit(5);

        // -----------------------------
        // RESPONSE
        // -----------------------------

        return res.status(200).json({
            success: true,

            dashboard: {
                transactions: {
                    total: totalTransactions,
                    completed: completedTransactions,
                    pending: pendingTransactions,
                    blocked: blockedTransactions,
                    cancelled: cancelledTransactions,
                    verified: verifiedTransactions
                },

                fraudAlerts: {
                    total: totalFraudAlerts,
                    open: openFraudAlerts,
                    highRisk: highRiskAlerts
                },

                voiceSecurity: {
                    totalAnalyses: totalVoiceAnalyses,
                    legitimate: legitimateVoiceCount,
                    suspicious: suspiciousVoiceCount,
                    fraud: fraudVoiceCount,
                    averageRiskScore:
                        Number(averageRiskScore)
                },

                recent: {
                    voiceAnalyses:
                        recentVoiceAnalyses,
                    transactions:
                        recentTransactions,
                    alerts:
                        recentAlerts
                }
            }
        });

    } catch (error) {

        console.error(
            "SECURITY DASHBOARD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to load security dashboard"
        });
    }
};