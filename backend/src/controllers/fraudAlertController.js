import FraudAlert from "../models/FraudAlert.js";


// ==========================================
// GET FRAUD ALERTS
// ==========================================

export const getFraudAlerts =
    async (req, res) => {

        try {

            const alerts =
                await FraudAlert
                    .find({
                        user:
                            req.user.userId
                    })
                    .populate(
                        "voiceAnalysis",
                        "filename riskScore verdict createdAt"
                    )
                    .sort({
                        createdAt: -1
                    });


            return res.status(200).json({

                success: true,

                count:
                    alerts.length,

                alerts

            });

        } catch (error) {

            console.error(
                "GET FRAUD ALERTS ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to fetch fraud alerts"

            });
        }
    };


// ==========================================
// UPDATE ALERT STATUS
// ==========================================

export const updateFraudAlertStatus =
    async (req, res) => {

        try {

            const {
                status
            } = req.body;


            if (
                ![
                    "open",
                    "reviewed",
                    "resolved"
                ].includes(status)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid alert status"

                });
            }


            const alert =
                await FraudAlert.findOneAndUpdate(

                    {
                        _id:
                            req.params.id,

                        user:
                            req.user.userId

                    },

                    {
                        status
                    },

                    {
                        new: true
                    }
                );


            if (!alert) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Fraud alert not found"

                });
            }


            return res.status(200).json({

                success: true,

                message:
                    "Fraud alert updated",

                alert

            });

        } catch (error) {

            console.error(
                "UPDATE FRAUD ALERT ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to update fraud alert"

            });
        }
    };