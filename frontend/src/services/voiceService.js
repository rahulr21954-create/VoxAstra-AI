import api from "./api";

export const uploadVoice = async (file) => {
    if (!file) {
        throw new Error("Please select a voice file first.");
    }

    const formData = new FormData();
    formData.append("voice", file);

    const response = await api.post(
        "/voice/upload",
        formData
    );

    return response.data;
};

export const analyzeVoice = async (analysisId) => {
    const response = await api.post(
        `/voice/analyze/${analysisId}`
    );

    return response.data;
};

export const getVoiceAnalyses = async () => {
    const response = await api.get(
        "/voice/analyses"
    );

    return response.data;
};