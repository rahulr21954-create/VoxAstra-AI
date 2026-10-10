
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    getFraudAlerts,
    updateFraudAlertStatus
} from "../services/fraudAlertService";

const severityStyles = {
    low: "border-sky-400/20 bg-sky-400/10 text-sky-300",
    medium: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    high: "border-orange-400/20 bg-orange-400/10 text-orange-300",
    critical: "border-red-400/20 bg-red-400/10 text-red-300"
};

const statusStyles = {
    open: "bg-red-400/10 text-red-300",
    reviewed: "bg-amber-400/10 text-amber-300",
    resolved: "bg-emerald-400/10 text-emerald-300"
};

const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN");
};

const FraudAlerts = () => {
    const [alerts, setAlerts] = useState([]);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const loadAlerts = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getFraudAlerts();
            setAlerts(data.alerts || []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not load fraud alerts. Check the backend and login session."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAlerts();
    }, [loadAlerts]);

    const handleStatusChange = async (alertId, status) => {
        setUpdatingId(alertId);
        setError("");
        setNotice("");

        try {
            const data = await updateFraudAlertStatus(
                alertId,
                status
            );

            const updatedAlert =
                data.alert ||
                data.fraudAlert ||
                data.data?.alert;

            setAlerts((current) =>
                current.map((alert) => {
                    if (alert._id !== alertId) {
                        return alert;
                    }

                    return {
                        ...alert,
                        status: updatedAlert?.status || status
                    };
                })
            );

            setNotice(`Alert status updated to ${status}.`);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update alert status."
            );
        } finally {
            setUpdatingId("");
        }
    };

    const filteredAlerts = alerts.filter((alert) => {
        return filter === "all" || alert.status === filter;
    });

    const openCount = alerts.filter(
        (alert) => alert.status === "open"
    ).length;

    const highRiskCount = alerts.filter(
        (alert) =>
            ["high", "critical"].includes(alert.severity) &&
            alert.status !== "resolved"
    ).length;

    const resolvedCount = alerts.filter(
        (alert) => alert.status === "resolved"
    ).length;

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-800 bg-slate-950 px-5 py-7 md:flex">
                <Link
                    to="/dashboard"
                    className="mb-10 flex items-center gap-3"
                >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-lg font-black text-slate-950">
                        V
                    </div>

                    <div>
                        <h1 className="text-lg font-bold">VoxAstra</h1>
                        <p className="text-xs text-slate-500">AI Security</p>
                    </div>
                </Link>

                <nav className="space-y-2">
                    <Link
                        to="/dashboard"
                        className="block rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-slate-900 hover:text-white"
                    >
                        Overview
                    </Link>

                    <Link
                        to="/voice"
                        className="block rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-slate-900 hover:text-white"
                    >
                        Voice Analysis
                    </Link>

                    <Link
                        to="/transactions"
                        className="block rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-slate-900 hover:text-white"
                    >
                        Transactions
                    </Link>

                    <Link
                        to="/fraud-alerts"
                        className="block rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
                    >
                        Fraud Alerts
                    </Link>
                </nav>

                <div className="mt-auto rounded-xl border border-red-400/20 bg-red-400/5 p-4">
                    <p className="text-sm font-semibold text-red-300">
                        Threat Monitoring
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-400">
                        Review suspicious voice activity and track alert resolution.
                    </p>
                </div>
            </aside>

            <main className="min-w-0 p-5 sm:p-8 md:ml-64 md:p-10">
                <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
                            Threat intelligence
                        </p>

                        <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                            Fraud Alerts
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            Review detected voice risks and manage alert status.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadAlerts}
                        disabled={loading}
                        className="w-fit rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-emerald-400 hover:text-white disabled:opacity-50"
                    >
                        {loading ? "Refreshing..." : "↻ Refresh alerts"}
                    </button>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
                    >
                        {error}
                    </div>
                )}

                {notice && !error && (
                    <div
                        role="status"
                        className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300"
                    >
                        {notice}
                    </div>
                )}

                <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        {
                            label: "Total alerts",
                            value: alerts.length,
                            color: "text-white"
                        },
                        {
                            label: "Open alerts",
                            value: openCount,
                            color: "text-red-300"
                        },
                        {
                            label: "High / critical unresolved",
                            value: highRiskCount,
                            color: "text-orange-300"
                        },
                        {
                            label: "Resolved",
                            value: resolvedCount,
                            color: "text-emerald-300"
                        }
                    ].map((card) => (
                        <div
                            key={card.label}
                            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
                        >
                            <p className="text-sm text-slate-400">
                                {card.label}
                            </p>

                            <p className={`mt-3 text-3xl font-bold ${card.color}`}>
                                {loading ? "…" : card.value}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
                    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Alert queue
                            </h3>

                            <p className="mt-1 text-sm text-slate-400">
                                {filteredAlerts.length} alert(s) in this view
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {["all", "open", "reviewed", "resolved"].map(
                                (status) => (
                                    <button
                                        key={status}
                                        type="button"
                                        onClick={() => setFilter(status)}
                                        className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize transition ${
                                            filter === status
                                                ? "bg-emerald-400 text-slate-950"
                                                : "border border-slate-700 text-slate-400 hover:text-white"
                                        }`}
                                    >
                                        {status}
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-14 text-center text-sm text-slate-500">
                            Loading fraud alerts...
                        </div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-800 px-5 py-14 text-center">
                            <div className="text-3xl text-slate-600">✓</div>

                            <p className="mt-3 font-semibold text-slate-300">
                                No alerts in this view
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                                Try another filter or analyze a voice sample.
                            </p>

                            <Link
                                to="/voice"
                                className="mt-5 inline-flex rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-300"
                            >
                                Analyze voice
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAlerts.map((alert) => (
                                <article
                                    key={alert._id}
                                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
                                >
                                    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span
                                                    className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                                                        severityStyles[alert.severity] ||
                                                        severityStyles.medium
                                                    }`}
                                                >
                                                    {alert.severity || "medium"}
                                                </span>

                                                <span
                                                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
                                                        statusStyles[alert.status] ||
                                                        statusStyles.open
                                                    }`}
                                                >
                                                    {alert.status || "open"}
                                                </span>
                                            </div>

                                            <h4 className="mt-4 break-words font-semibold text-white">
                                                {alert.reason || "Suspicious voice activity detected"}
                                            </h4>

                                            <p className="mt-2 text-sm leading-6 text-slate-400">
                                                {alert.recommendedAction ||
                                                    "Review the event and independently verify the transaction."}
                                            </p>

                                            <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                                                <div>
                                                    <p className="text-slate-500">
                                                        Voice file
                                                    </p>

                                                    <p className="mt-1 break-all text-slate-300">
                                                        {alert.voiceAnalysis?.filename ||
                                                            "Voice analysis"}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-slate-500">
                                                        Created
                                                    </p>

                                                    <p className="mt-1 text-slate-300">
                                                        {formatDate(alert.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="min-w-32 rounded-xl border border-slate-800 bg-slate-900 p-4 lg:text-right">
                                            <p className="text-xs text-slate-500">
                                                Risk score
                                            </p>

                                            <p className={`mt-2 text-3xl font-bold tabular-nums ${
                                                Number(alert.riskScore) >= 85
                                                    ? "text-red-400"
                                                    : Number(alert.riskScore) >= 75
                                                        ? "text-orange-300"
                                                        : "text-amber-300"
                                            }`}>
                                                {Number(alert.riskScore).toFixed(1)}
                                                <span className="text-sm">%</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
                                        {alert.status === "open" && (
                                            <button
                                                type="button"
                                                disabled={updatingId === alert._id}
                                                onClick={() =>
                                                    handleStatusChange(
                                                        alert._id,
                                                        "reviewed"
                                                    )
                                                }
                                                className="rounded-lg border border-amber-400/30 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-400/10 disabled:opacity-50"
                                            >
                                                {updatingId === alert._id
                                                    ? "Updating..."
                                                    : "Mark reviewed"}
                                            </button>
                                        )}

                                        {alert.status !== "resolved" && (
                                            <button
                                                type="button"
                                                disabled={updatingId === alert._id}
                                                onClick={() =>
                                                    handleStatusChange(
                                                        alert._id,
                                                        "resolved"
                                                    )
                                                }
                                                className="rounded-lg border border-emerald-400/30 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50"
                                            >
                                                Mark resolved
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default FraudAlerts;
