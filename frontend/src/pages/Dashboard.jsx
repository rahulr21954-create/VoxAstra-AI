
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import { getSecurityDashboard } from "../services/dashboardService";
import { logoutUser } from "../services/authService";

const formatDate = (value) => {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Date unavailable";
    }

    return date.toLocaleString();
};

const formatNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number)
        ? number.toLocaleString()
        : "—";
};

const formatCurrency = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) return "—";

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(number);
};

const StatCard = ({ title, value, description, accent = "emerald" }) => {
    const accents = {
        emerald: "border-emerald-400/20 bg-emerald-400/5 text-emerald-300",
        red: "border-red-400/20 bg-red-400/5 text-red-300",
        amber: "border-amber-400/20 bg-amber-400/5 text-amber-300",
        blue: "border-blue-400/20 bg-blue-400/5 text-blue-300"
    };

    return (
        <div className="rounded-2xl border border-slate-800 bg-[#0C1814] p-5 transition hover:border-slate-700">
            <p className="text-sm text-slate-400">{title}</p>

            <p className={`mt-4 text-3xl font-bold ${accents[accent].split(" ").at(-1)}`}>
                {value}
            </p>

            <p className="mt-3 text-xs text-slate-500">{description}</p>
        </div>
    );
};

const Section = ({ title, count, children }) => (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0C1814]">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
            <h2 className="font-semibold text-white">{title}</h2>

            {count !== undefined && (
                <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                    {count}
                </span>
            )}
        </div>

        <div className="p-5">{children}</div>
    </section>
);

const EmptyState = ({ message }) => (
    <p className="py-5 text-center text-sm text-slate-500">{message}</p>
);

const Dashboard = () => {
    const navigate = useNavigate();

    const [activePage, setActivePage] = useState("overview");
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getSecurityDashboard();

                if (!response.success) {
                    throw new Error("Unable to load dashboard data.");
                }

                if (!cancelled) {
                    setDashboardData(response.dashboard);
                }
            } catch (err) {
                if (cancelled) return;

                if (err.response?.status === 401) {
                    logoutUser();
                    navigate("/login", { replace: true });
                    return;
                }

                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to load dashboard."
                );
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    const user = (() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    })();

    const transactions = dashboardData?.transactions;
    const fraudAlerts = dashboardData?.fraudAlerts;
    const voiceSecurity = dashboardData?.voiceSecurity;
    const recent = dashboardData?.recent;

    const handleNavigation = (page) => {
        setActivePage(page);

        const paths = {
            overview: "/dashboard",
            voice: "/voice",
            transactions: "/transactions",
            alerts: "/alerts",
            security: "/security"
        };

        if (paths[page] && page !== "overview") {
            navigate(paths[page]);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#07100D] text-white">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
                    <p className="mt-4 text-sm text-slate-400">
                        Loading your security dashboard...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#07100D] px-4 text-white">
                <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#0C1814] p-6">
                    <h2 className="text-lg font-semibold">Dashboard unavailable</h2>

                    <p className="mt-3 text-sm text-red-300">{error}</p>

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-5 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#07100D] text-white">
            <Sidebar
                activePage={activePage}
                setActivePage={handleNavigation}
            />

            <main className="min-h-screen px-5 py-7 md:ml-64 md:px-8 lg:px-10">
                <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                            VoxAstra / Security Center
                        </p>

                        <h1 className="mt-2 text-3xl font-bold tracking-tight">
                            Security Dashboard
                        </h1>

                        <p className="mt-2 text-sm text-slate-400">
                            Monitor voice fraud, transaction security and alerts.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-300">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            API Connected
                        </span>

                        <button
                            onClick={() => window.location.reload()}
                            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-900"
                        >
                            Refresh
                        </button>
                    </div>
                </header>

                <section className="mb-8 rounded-2xl border border-slate-800 bg-gradient-to-r from-emerald-950/40 to-[#0C1814] p-6">
                    <p className="text-sm text-slate-400">Signed in as</p>

                    <h2 className="mt-2 text-2xl font-semibold">
                        {user?.name || user?.email || "Authenticated user"}
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                        Security metrics below are retrieved from your authenticated backend.
                    </p>
                </section>

                <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Total Transactions"
                        value={formatNumber(transactions?.total)}
                        description="Transactions recorded"
                        accent="blue"
                    />

                    <StatCard
                        title="Blocked Transactions"
                        value={formatNumber(transactions?.blocked)}
                        description="Transactions blocked by security"
                        accent="red"
                    />

                    <StatCard
                        title="Voice Analyses"
                        value={formatNumber(voiceSecurity?.totalAnalyses)}
                        description="Recorded voice analyses"
                        accent="emerald"
                    />

                    <StatCard
                        title="Average Risk Score"
                        value={
                            voiceSecurity?.averageRiskScore == null
                                ? "—"
                                : `${formatNumber(voiceSecurity.averageRiskScore)}%`
                        }
                        description="Average across analyzed voices"
                        accent="amber"
                    />
                </section>

                <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Legitimate Voices"
                        value={formatNumber(voiceSecurity?.legitimate)}
                        description="Classified as legitimate"
                    />

                    <StatCard
                        title="Suspicious Voices"
                        value={formatNumber(voiceSecurity?.suspicious)}
                        description="Require additional review"
                        accent="amber"
                    />

                    <StatCard
                        title="Fraud Voices"
                        value={formatNumber(voiceSecurity?.fraud)}
                        description="Classified as potential fraud"
                        accent="red"
                    />

                    <StatCard
                        title="Open Fraud Alerts"
                        value={formatNumber(fraudAlerts?.open)}
                        description="Alerts awaiting resolution"
                        accent="amber"
                    />
                </section>

                <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Completed"
                        value={formatNumber(transactions?.completed)}
                        description="Completed transactions"
                    />

                    <StatCard
                        title="Pending"
                        value={formatNumber(transactions?.pending)}
                        description="Awaiting completion or verification"
                        accent="amber"
                    />

                    <StatCard
                        title="Verified"
                        value={formatNumber(transactions?.verified)}
                        description="Secondary verification completed"
                        accent="blue"
                    />

                    <StatCard
                        title="Total Fraud Alerts"
                        value={formatNumber(fraudAlerts?.total)}
                        description="All recorded fraud alerts"
                        accent="red"
                    />
                </section>

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <Section
                        title="Recent Transactions"
                        count={recent?.transactions?.length ?? 0}
                    >
                        {!recent?.transactions?.length ? (
                            <EmptyState message="No transactions recorded yet." />
                        ) : (
                            <div className="space-y-4">
                                {recent.transactions.map((item) => (
                                    <div
                                        key={item._id}
                                        className="flex flex-col gap-3 rounded-xl border border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-white">
                                                {item.description || item.category || "Transaction"}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {formatDate(item.createdAt)}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                {item.type || "—"} · {item.paymentMethod || "—"}
                                            </p>
                                        </div>

                                        <div className="sm:text-right">
                                            <p className="font-semibold">
                                                {formatCurrency(item.amount)}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                {item.status || "Unknown status"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    <Section
                        title="Recent Fraud Alerts"
                        count={recent?.alerts?.length ?? 0}
                    >
                        {!recent?.alerts?.length ? (
                            <EmptyState message="No fraud alerts recorded yet." />
                        ) : (
                            <div className="space-y-4">
                                {recent.alerts.map((alert) => (
                                    <div
                                        key={alert._id}
                                        className="rounded-xl border border-slate-800 p-4"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <span className="text-sm font-medium text-white">
                                                {alert.severity || "Unspecified severity"}
                                            </span>

                                            <span className="rounded-lg border border-red-400/20 bg-red-400/5 px-2.5 py-1 text-xs text-red-300">
                                                Risk: {formatNumber(alert.riskScore)}%
                                            </span>
                                        </div>

                                        <p className="mt-3 text-sm text-slate-300">
                                            {alert.reason || "No reason provided."}
                                        </p>

                                        <p className="mt-2 text-xs text-slate-500">
                                            {formatDate(alert.createdAt)}
                                        </p>

                                        <p className="mt-3 text-xs text-emerald-300">
                                            Recommended: {alert.recommendedAction || "Review the alert."}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    <Section
                        title="Recent Voice Analyses"
                        count={recent?.voiceAnalyses?.length ?? 0}
                    >
                        {!recent?.voiceAnalyses?.length ? (
                            <EmptyState message="No voice analyses recorded yet." />
                        ) : (
                            <div className="space-y-4">
                                {recent.voiceAnalyses.map((analysis) => (
                                    <div
                                        key={analysis._id}
                                        className="flex flex-col gap-3 rounded-xl border border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {analysis.filename || "Audio file"}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {formatDate(analysis.createdAt)}
                                            </p>
                                        </div>

                                        <div className="sm:text-right">
                                            <p className="text-sm font-semibold">
                                                {analysis.riskScore == null
                                                    ? "Risk unavailable"
                                                    : `${formatNumber(analysis.riskScore)}% risk`}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                {analysis.verdict || analysis.status || "Unknown"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    <Section title="Security Summary">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-slate-400">
                                    High-risk alerts
                                </span>
                                <span className="font-semibold text-red-300">
                                    {formatNumber(fraudAlerts?.highRisk)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-slate-400">
                                    Cancelled transactions
                                </span>
                                <span className="font-semibold">
                                    {formatNumber(transactions?.cancelled)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-slate-400">
                                    Total voice analyses
                                </span>
                                <span className="font-semibold">
                                    {formatNumber(voiceSecurity?.totalAnalyses)}
                                </span>
                            </div>

                            <p className="border-t border-slate-800 pt-4 text-xs leading-5 text-slate-500">
                                Risk classifications are model outputs, not definitive proof of fraud.
                                Review high-risk cases before taking irreversible action.
                            </p>
                        </div>
                    </Section>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;

