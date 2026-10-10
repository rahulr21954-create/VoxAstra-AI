
import axios from "axios";

const API_BASE_URL = `http://localhost:${process.env.PORT}/api`;

const api = axios.create({
    baseURL: API_BASE_URL
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // JSON requests use the normal JSON content type.
        // For FormData, let the browser/Axios set the multipart boundary.
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        } else if (config.data !== undefined) {
            config.headers["Content-Type"] = "application/json";
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
