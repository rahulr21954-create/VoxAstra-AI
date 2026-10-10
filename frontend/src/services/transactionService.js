
import api from "./api";

export const getTransactions = async () => {
    const response = await api.get("/transactions");
    return response.data;
};

export const createTransaction = async (transactionData) => {
    const response = await api.post(
        "/transactions",
        transactionData
    );

    return response.data;
};

export const evaluateTransaction = async ({
    amount,
    voiceAnalysisId
}) => {
    const response = await api.post(
        "/transactions/evaluate",
        {
            amount: Number(amount),
            voiceAnalysisId
        }
    );

    return response.data;
};
