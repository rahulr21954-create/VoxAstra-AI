export const evaluateTransactionRisk = ({
    amount,
    voiceRiskScore,
    voiceVerdict
}) => {

    const transactionAmount =
        Number(amount);

    const riskScore =
        Number(voiceRiskScore);


    // =====================================
    // NO VOICE RISK
    // =====================================

    if (
        Number.isNaN(riskScore) ||
        !voiceVerdict
    ) {

        return {
            decision: "allow",

            reason:
                "No voice fraud risk information available.",

            requiresSecondaryAuth: false
        };
    }


    // =====================================
    // CRITICAL FRAUD
    // =====================================

    if (
        voiceVerdict === "fraud" &&
        riskScore >= 85
    ) {

        return {
            decision: "block",

            reason:
                "High-confidence synthetic voice detected.",

            requiresSecondaryAuth: true
        };
    }


    // =====================================
    // HIGH RISK + HIGH VALUE
    // =====================================

    if (
        riskScore >= 75 &&
        transactionAmount >= 10000
    ) {

        return {
            decision: "block",

            reason:
                "High voice fraud risk combined with high-value transaction.",

            requiresSecondaryAuth: true
        };
    }


    // =====================================
    // SUSPICIOUS
    // =====================================

    if (
        voiceVerdict === "suspicious" ||
        riskScore >= 45
    ) {

        return {
            decision: "verify",

            reason:
                "Suspicious voice characteristics detected.",

            requiresSecondaryAuth: true
        };
    }


    // =====================================
    // LOW RISK
    // =====================================

    return {
        decision: "allow",

        reason:
            "Voice risk is below the verification threshold.",

        requiresSecondaryAuth: false
    };
};