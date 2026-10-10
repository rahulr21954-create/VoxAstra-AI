
import api from "./api";

export const getFraudAlerts = async () => {
    const response = await api.get("/fraud-alerts");
    return response.data;
};

export const updateFraudAlertStatus = async (alertId, status) => {
    const response = await api.patch(
        `/fraud-alerts/${alertId}/status`,
        { status }
    );

    return response.data;
};
