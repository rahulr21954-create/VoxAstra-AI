import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import fraudAlertRoutes from "./routes/fraudAlertRoutes.js";
import verificationRoutes
    from "./routes/verificationRoutes.js";

import dashboardRoutes
    from "./routes/dashboardRoutes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 8000;

// Database
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "VoxAstra AI backend is running",
        timestamp: new Date().toISOString()
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/fraud-alerts",fraudAlertRoutes);
app.use(
    "/api/verification",
    verificationRoutes
);

app.use(
    "/api/dashboard",
    dashboardRoutes
);

app.listen(PORT, () => {
    console.log(`VoxAstra backend running on port ${PORT}`);
});