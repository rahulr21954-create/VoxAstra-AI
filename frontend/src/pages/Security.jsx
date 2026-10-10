
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { getSecurityDashboard } from "../services/securityService";

const emptyStats = {
    transactions: null,
    fraudAlerts: null,
    voiceAnalyses: null,
    averageRisk: null,
    blocked: null,
    pending: null,
};

function unwrap(response) {
    return response?.data?.data ?? response?.data ?? response ?? {};
}

function getRecords(data, keys) {
    if (Array.isArray(data)) return data;

    for (const key of keys) {
        if (Array.isArray(data?.[key])) return data[key];
    }

    if (data?.data && typeof data.data === "object") {
        return getRecords(data.data, keys);
    }

    return [];
}

function getNumber(source, keys) {
    if (!source || typeof source !== "object") return null;

    for (const key of keys) {
        const value = source[key];

        if (
            value !== null &&
            value !== undefined &&
            value !== "" &&
            Number.isFinite(Number(value))
        ) {
            return Number(value);
        }
    }

    for (const key of ["stats", "summary", "analytics"]) {
        const result = getNumber(source[key], keys);
        if (result !== null) return result;
    }

    return null;
}

function averageRisk(records) {
    const scores = records
        .map((item) => Number(item.riskScore))
        .filter((score) => Number.isFinite(score) && score >= 0 && score <= 100);

    if (!scores.length) return null;

    return Math.round(
        (scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10
    ) / 10;
}

function StatCard({ title, value, description, icon }) {
    return (
        <div className="rounded-2xl border border-emerald-900/60 bg-[#0C1814] p-5">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{title}</p>
                <span className="text-xl">{icon}</span>
            </div>

            <p className="mt-4 text-3xl font-bold text-white">
                {value === null || value === undefined
                    ? "—"
                    : typeof value === "number"
                        ? value.toLocaleString("en-IN")
                        : value}
            </p>

            <p className="mt-2 text-xs text-gray-500">{description}</p>
        </div>
    );
}

function DecisionBadge({ decision, status }) {
    const value = String(decision || status || "unknown").toLowerCase();

    const styles = {
        allow: "border-emerald-700/50 bg-emerald-500/10 text-emerald-300",
        completed: "border-emerald-700/50 bg-emerald-500/10 text-emerald-300",
        verify: "border-amber-700/50 bg-amber-500/10 text-amber-300",
        pending: "border-amber-700/50 bg-amber-500/10 text-amber-300",
        block: "border-red-700/50 bg-red-500/10 text-red-300",
        blocked: "border-red-700/50 bg-red-500/10 text-red-300",
    };

    return (
        <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                styles[value] || "border-gray-700 bg-gray-800 text-gray-300"
            }`}
        >
            {value.replaceAll("_", " ")}
        </span>
    );
}

export default function Security() {
    const [stats, setStats] = useState(emptyStats);
    const [transactions, setTransactions] = useState([]);
    const [analyses, setAnalyses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState(null);

    const loadSecurityData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            // Fetch independently so one failed endpoint does not hide all data.
            const results = await Promise.allSettled([
                getSecurityDashboard(),
                api.get("/transactions"),
                api.get("/voice/analyses"),
            ]);

            const [dashboardResult, transactionResult, analysisResult] = results;

            const dashboard =
                dashboardResult.status === "fulfilled"
                    ? unwrap(dashboardResult.value)
                    : {};

            const transactionData =
                transactionResult.status === "fulfilled"
                    ? unwrap(transactionResult.value)
                    : {};

            const analysisData =
                analysisResult.status === "fulfilled"
                    ? unwrap(analysisResult.value)
                    : {};

            const transactionRecords = getRecords(transactionData, [
                "transactions",
                "records",
                "items",
            ]);

            const analysisRecords = getRecords(analysisData, [
                "analyses",
                "voiceAnalyses",
                "records",
                "items",
            ]);

            setTransactions(transactionRecords);
            setAnalyses(analysisRecords);

            const allScores = [
                ...analysisRecords,
                ...transactionRecords,
            ];

            const calculatedAverage = averageRisk(allScores);

            const blockedCount = transactionRecords.filter(
                (item) =>
                    item.status === "blocked" ||
                    item.securityDecision === "block"
            ).length;

            const pendingCount = transactionRecords.filter(
                (item) =>
                    item.status === "pending" ||
                    item.securityDecision === "verify" ||
                    item.verificationStatus === "pending"
            ).length;

            const alertCount = transactionRecords.filter(
                (item) =>
                    item.securityDecision === "block" ||
                    item.securityDecision === "verify" ||
                    item.status === "blocked"
            ).length;

            const totalTransactions = getNumber(dashboard, [
                "totalTransactions",
                "transactionCount",
            ]);

            const totalAlerts = getNumber(dashboard, [
                "totalFraudAlerts",
                "totalAlerts",
                "alertCount",
            ]);

            const totalAnalyses = getNumber(dashboard, [
                "totalVoiceAnalyses",
                "totalAnalyses",
                "analysisCount",
            ]);

            const apiAverage = getNumber(dashboard, [
                "averageRiskScore",
                "avgRiskScore",
                "averageRisk",
            ]);

            setStats({
                transactions:
                    totalTransactions ?? (
                        transactionResult.status === "fulfilled"
                            ? transactionRecords.length
                            : null
                    ),

                fraudAlerts:
                    totalAlerts ?? (
                        transactionResult.status === "fulfilled"
                            ? alertCount
                            : null
                    ),

                voiceAnalyses:
                    totalAnalyses ?? (
                        analysisResult.status === "fulfilled"
                            ? analysisRecords.length
                            : null
                    ),

                averageRisk: apiAverage ?? calculatedAverage,

                blocked:
                    transactionResult.status === "fulfilled"
                        ? blockedCount
                        : null,

                pending:
                    transactionResult.status === "fulfilled"
                        ? pendingCount
                        : null,
            });

            const anySuccess = results.some(
                (result) => result.status === "fulfilled"
            );

            if (!anySuccess) {
                throw new Error("All security endpoints failed.");
            }

            setLastUpdated(new Date());
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Security data could not be loaded."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSecurityData();
    }, [loadSecurityData]);

    const recentActivity = [...transactions]
        .sort(
            (a, b) =>
                new Date(b.createdAt || 0).getTime() -
                new Date(a.createdAt || 0).getTime()
        )
        .slice(0, 8);

    return (
        <div className="min-h-screen bg-[#07100D] text-white">
            <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-emerald-900/50 bg-[#0A1511] p-6 lg:block">
                <h1 className="text-2xl font-bold text-emerald-400">
                    VoxAstra AI
                </h1>
                <p className="mt-1 text-xs text-gray-500">
                    Voice Fraud Protection
                </p>

                <nav className="mt-10 space-y-2">
                    {[
                        ["Dashboard", "/dashboard"],
                        ["Voice Analysis", "/voice"],
                        ["Transactions", "/transactions"],
                        ["Fraud Alerts", "/fraud-alerts"],
                        ["Security", "/security"],
                        ["Verification", "/verification"],
                    ].map(([label, path]) => (
                        <Link
                            key={path}
                            to={path}
                            className={`block rounded-xl px-4 py-3 text-sm transition ${
                                path === "/security"
                                    ? "bg-emerald-500/15 font-semibold text-emerald-300"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </nav>
            </aside>

            <main className="p-5 sm:p-8 lg:ml-64 lg:p-10">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm text-emerald-400">
                            SECURITY CENTER
                        </p>
                        <h2 className="mt-2 text-3xl font-bold">
                            Security Overview
                        </h2>
                        <p className="mt-2 text-sm text-gray-400">
                            Live security information from your backend.
                        </p>
                        {lastUpdated && (
                            <p className="mt-2 text-xs text-gray-500">
                                Updated: {lastUpdated.toLocaleTimeString()}
                            </p>
                        )}
                    </div>

                    <button
                        onClick={loadSecurityData}
                        disabled={loading}
                        className="rounded-xl border border-emerald-700 px-5 py-3 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10 disabled:opacity-50"
                    >
                        {loading ? "Refreshing..." : "↻ Refresh Data"}
                    </button>
                </header>

                {error && (
                    <div className="mt-6 rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {loading && transactions.length === 0 && analyses.length === 0 ? (
                    <div className="mt-8 animate-pulse rounded-2xl border border-emerald-900/60 bg-[#0C1814] p-8 text-gray-400">
                        Loading security data...
                    </div>
                ) : (
                    <>
                        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                            <StatCard
                                title="Transactions"
                                value={stats.transactions}
                                description="Transactions returned by your API"
                                icon="↔"
                            />
                            <StatCard
                                title="Fraud Alerts"
                                value={stats.fraudAlerts}
                                description="Blocked or verification-required transactions"
                                icon="⚠"
                            />
                            <StatCard
                                title="Voice Analyses"
                                value={stats.voiceAnalyses}
                                description="Voice analyses returned by your API"
                                icon="♫"
                            />
                            <StatCard
                                title="Average Risk Score"
                                value={
                                    stats.averageRisk === null
                                        ? null
                                        : `${stats.averageRisk}%`
                                }
                                description="Mean of available risk scores"
                                icon="◈"
                            />
                        </div>

                        <div className="mt-5 grid gap-5 sm:grid-cols-2">
                            <StatCard
                                title="Blocked Transactions"
                                value={stats.blocked}
                                description="Transactions marked blocked"
                                icon="⛔"
                            />
                            <StatCard
                                title="Pending Verification"
                                value={stats.pending}
                                description="Transactions requiring review or verification"
                                icon="🔐"
                            />
                        </div>

                        <section className="mt-8 overflow-hidden rounded-2xl border border-emerald-900/60 bg-[#0C1814]">
                            <div className="flex flex-col gap-2 border-b border-emerald-900/50 p-6 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Recent Transaction Security
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-400">
                                        Latest transactions returned by the API.
                                    </p>
                                </div>
                                <Link
                                    to="/transactions"
                                    className="text-sm text-emerald-300 hover:text-emerald-200"
                                >
                                    View all transactions →
                                </Link>
                            </div>

                            {recentActivity.length === 0 ? (
                                <div className="p-8 text-sm text-gray-400">
                                    {error
                                        ? "Transaction records could not be loaded."
                                        : "No transactions are available yet."}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[720px] text-left text-sm">
                                        <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-gray-500">
                                            <tr>
                                                <th className="px-6 py-4">Transaction</th>
                                                <th className="px-6 py-4">Amount</th>
                                                <th className="px-6 py-4">Risk</th>
                                                <th className="px-6 py-4">Decision</th>
                                                <th className="px-6 py-4">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-emerald-900/40">
                                            {recentActivity.map((item) => (
                                                <tr key={item._id || item.id}>
                                                    <td className="px-6 py-4">
                                                        <p className="font-medium text-white">
                                                            {item.transactionId ||
                                                                item.description ||
                                                                item._id ||
                                                                "Transaction"}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {item.category || item.type || "—"}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {item.riskScore == null
                                                            ? "—"
                                                            : `${item.riskScore}%`}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <DecisionBadge
                                                            decision={item.securityDecision}
                                                            status={item.status}
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-400">
                                                        {item.createdAt
                                                            ? new Date(item.createdAt).toLocaleString("en-IN")
                                                            : "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        <section className="mt-8 rounded-2xl border border-emerald-900/60 bg-[#0C1814] p-6">
                            <h3 className="text-lg font-semibold">
                                Voice Risk Classification
                            </h3>
                            <p className="mt-2 text-sm text-gray-400">
                                These bands reflect the current prototype risk rules,
                                not validated fraud probabilities.
                            </p>

                            <div className="mt-6 space-y-5">
                                {[
                                    {
                                        label: "Lower risk",
                                        range: "0–44",
                                        width: "44%",
                                        color: "bg-emerald-500",
                                        text: "text-emerald-300",
                                    },
                                    {
                                        label: "Suspicious — verification",
                                        range: "45–74",
                                        width: "74%",
                                        color: "bg-amber-500",
                                        text: "text-amber-300",
                                    },
                                    {
                                        label: "High risk — review",
                                        range: "75–100",
                                        width: "100%",
                                        color: "bg-red-500",
                                        text: "text-red-300",
                                    },
                                ].map((band) => (
                                    <div key={band.label}>
                                        <div className="mb-2 flex justify-between gap-3 text-sm">
                                            <span className={band.text}>{band.label}</span>
                                            <span className="text-gray-400">{band.range}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-gray-800">
                                            <div
                                                className={`h-2 rounded-full ${band.color}`}
                                                style={{ width: band.width }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="mt-8 grid gap-5 md:grid-cols-2">
                            <div className="rounded-2xl border border-emerald-900/60 bg-[#0C1814] p-6">
                                <h3 className="font-semibold">Security Workflow</h3>
                                <ul className="mt-4 space-y-3 text-sm text-gray-300">
                                    <li>• JWT-protected API access</li>
                                    <li>• Voice analysis and risk scoring</li>
                                    <li>• Transaction decision history</li>
                                    <li>• Verification status tracking</li>
                                </ul>
                                <p className="mt-4 text-xs text-gray-500">
                                    These are application features, not a live security audit.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-emerald-900/60 bg-[#0C1814] p-6">
                                <h3 className="font-semibold">Model Limitations</h3>
                                <ul className="mt-4 space-y-3 text-sm text-gray-300">
                                    <li>• Prototype model scores are not calibrated probabilities.</li>
                                    <li>• Validate on separate real and synthetic recordings.</li>
                                    <li>• Require independent verification for high-risk payments.</li>
                                    <li>• Never expose JWT secrets or API keys in React.</li>
                                </ul>
                            </div>
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
