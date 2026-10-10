
import api from "./api";

// ==========================================
// CREATE VERIFICATION CHALLENGE
// ==========================================

export const createVerification = async (payload) => {
    if (
        !payload?.transactionId ||
        typeof payload.transactionId !== "string"
    ) {
        throw new Error("Valid transaction ID is required");
    }

    try {
        const response = await api.post(
            "/verification/create",
            {
                transactionId: payload.transactionId.trim()
            }
        );

        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            error.message ||
            "Failed to create verification challenge";

        throw new Error(message);
    }
};

// ==========================================
// VERIFY OTP
// ==========================================

export const verifyOtp = async (payload) => {
    if (!payload?.challengeId) {
        throw new Error("Challenge ID is required");
    }

    if (
        typeof payload.otp !== "string" ||
        !/^\d{6}$/.test(payload.otp)
    ) {
        throw new Error("OTP must be a valid six-digit string");
    }

    try {
        const response = await api.post(
            "/verification/verify",
            {
                challengeId: payload.challengeId,
                otp: payload.otp
            }
        );

        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.message ||
            error.message ||
            "OTP verification failed";

        throw new Error(message);
    }
};
