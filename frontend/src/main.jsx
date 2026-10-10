import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
    createBrowserRouter,
    Navigate,
    RouterProvider
} from "react-router-dom";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";

import "./index.css";
import VoiceAnalysis from "./pages/VoiceAnalysis.jsx";
import Transactions from './pages/Transactions.jsx'
import FraudAlerts from "./pages/FraudAlerts.jsx";
import Security from "./pages/Security.jsx";
import Verification from "./pages/Verification.jsx";

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/dashboard" replace />
    },
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/signup",
        element: <Signup />
    },
    {
        path: "/dashboard",
        element: (
            <ProtectedRoute>
                <Dashboard />
            </ProtectedRoute>
        )
    },
    {
        path: "*",
        element: <Navigate to="/dashboard" replace />
    },
    {
     path:"/voice",
     element:(
        <ProtectedRoute>
            <VoiceAnalysis />
        </ProtectedRoute>
    )
    },
    {
     path:"/transactions",
     element:(
        <ProtectedRoute>
            <Transactions />
        </ProtectedRoute>
     )
    },
    {
     path:"/fraud-alerts",
     element:(
        <ProtectedRoute>
            <FraudAlerts />
        </ProtectedRoute>
     )
    },
    {
     path:"/security",
     element:(
        <ProtectedRoute>
            <Security />
        </ProtectedRoute>
     )
    },
    {
     path:"/verification",
     element:(
        <ProtectedRoute>
            <Verification />
        </ProtectedRoute>
     )
    },

]);

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <RouterProvider router={router} />
    </StrictMode>
);