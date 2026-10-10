
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../services/api";

import {
    createTransaction,
    evaluateTransaction,
    getTransactions
} from "../services/transactionService";

const statusStyle = {
    completed: "bg-emerald-400/10 text-emerald-400",
    pending: "bg-amber-400/10 text-amber-300",
    blocked: "bg-red-400/10 text-red-400",
    cancelled: "bg-slate-700 text-slate-300"
};

const decisionStyle = {
    allow: "text-emerald-400",
    verify: "text-amber-300",
    block: "text-red-400"
};

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [analyses, setAnalyses] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [evaluating, setEvaluating] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [evaluationResult, setEvaluationResult] = useState(null);

    const [form, setForm] = useState({
        amount: "",
        type: "debit",
        category: "other",
        description: "",
        paymentMethod: "upi"
    });

    const [protectedForm, setProtectedForm] = useState({
        amount: "",
        voiceAnalysisId: ""
    });

    const loadData = async () => {
        setLoading(true);
        setError("");

        try {
            const [transactionData, voiceData] = await Promise.all([
                getTransactions(),
                api.get("/voice/analyses")
            ]);

            setTransactions(transactionData.transactions || []);
            setAnalyses(
                (voiceData.data.analyses || []).filter(
                    (item) => item.status === "completed"
                )
            );
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not load transaction data. Check your login and backend."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value
        });
    };

    const handleCreate = async (event) => {
        event.preventDefault();

        setError("");
        setMessage("");
        setEvaluationResult(null);

        const amount = Number(form.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Enter a valid transaction amount greater than zero.");
            return;
        }

        setSaving(true);

        try {
            const data = await createTransaction({
                ...form,
                amount
            });

            setMessage(data.message || "Transaction created.");
            setForm({
                amount: "",
                type: "debit",
                category: "other",
                description: "",
                paymentMethod: "upi"
            });

            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not create transaction."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEvaluate = async (event) => {
        event.preventDefault();

        setError("");
        setMessage("");
        setEvaluationResult(null);

        if (
            !protectedForm.amount ||
            Number(protectedForm.amount) <= 0 ||
            !protectedForm.voiceAnalysisId
        ) {
            setError("Enter an amount and select a completed voice analysis.");
            return;
        }

        setEvaluating(true);

        try {
            const data = await evaluateTransaction(protectedForm);

            setEvaluationResult(data.transaction);
            setMessage(data.message || "Transaction risk evaluated.");

            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Transaction security evaluation failed."
            );
        } finally {
            setEvaluating(false);
        }
    };

    const totalAmount = transactions.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
    );

    const blockedCount = transactions.filter(
        (item) => item.status === "blocked"
    ).length;

    const pendingCount = transactions.filter(
        (item) => item.status === "pending"
    ).length;

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-slate-800 bg-slate-950 px-5 py-7 md:flex">
                <Link to="/dashboard" className="mb-10 flex items-center gap-3">
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
                        className="block rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
                    >
                        Transactions
                    </Link>
                </nav>

                <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="text-sm font-semibold text-emerald-300">
                        Transaction Security
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                        Evaluate transactions against voice risk signals.
                    </p>
                </div>
            </aside>

            <main className="min-w-0 p-5 sm:p-8 md:ml-64 md:p-10">
                <header className="mb-8">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                        Payment protection
                    </p>
                    <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                        Transactions
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Review activity and assess voice-related transaction risk.
                    </p>
                </header>

                {error && (
                    <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {message && !error && (
                    <div role="status" className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300">
                        {message}
                    </div>
                )}

                <section className="mb-8 grid gap-4 sm:grid-cols-3">
                    {[
                        {
                            label: "Transactions",
                            value: transactions.length,
                            color: "text-white"
                        },
                        {
                            label: "Blocked",
                            value: blockedCount,
                            color: "text-red-400"
                        },
                        {
                            label: "Pending",
                            value: pendingCount,
                            color: "text-amber-300"
                        }
                    ].map((card) => (
                        <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                            <p className="text-sm text-slate-400">{card.label}</p>
                            <p className={`mt-3 text-3xl font-bold ${card.color}`}>
                                {loading ? "…" : card.value}
                            </p>
                        </div>
                    ))}
                </section>

                <div className="grid gap-6 xl:grid-cols-2">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
                        <h3 className="text-lg font-semibold">Create transaction</h3>
                        <p className="mt-1 text-sm text-slate-400">
                            Add a transaction to your account history.
                        </p>

                        <form onSubmit={handleCreate} className="mt-6 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Amount (₹)
                                </label>
                                <input
                                    name="amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    value={form.amount}
                                    onChange={handleChange}
                                    placeholder="Enter amount"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Type
                                    </label>
                                    <select
                                        name="type"
                                        value={form.type}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
                                    >
                                        <option value="debit">Debit</option>
                                        <option value="credit">Credit</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-slate-300">
                                        Payment method
                                    </label>
                                    <select
                                        name="paymentMethod"
                                        value={form.paymentMethod}
                                        onChange={handleChange}
                                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
                                    >
                                        <option value="upi">UPI</option>
                                        <option value="card">Card</option>
                                        <option value="bank">Bank</option>
                                        <option value="cash">Cash</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
                                >
                                    <option value="other">Other</option>
                                    <option value="shopping">Shopping</option>
                                    <option value="bill">Bill payment</option>
                                    <option value="transfer">Transfer</option>
                                    <option value="food">Food</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Description
                                </label>
                                <input
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Optional description"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-slate-950 hover:bg-emerald-300 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Create transaction"}
                            </button>

                            <p className="text-xs leading-5 text-amber-300/80">
                                Demo workflow: this form creates a transaction marked completed by the current backend endpoint. Do not use it to execute real payments.
                            </p>
                        </form>
                    </section>

                    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
                        <h3 className="text-lg font-semibold">Protected transaction</h3>
                        <p className="mt-1 text-sm text-slate-400">
                            Evaluate a payment using a completed voice analysis.
                        </p>

                        <form onSubmit={handleEvaluate} className="mt-6 space-y-4">
                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Amount (₹)
                                </label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    value={protectedForm.amount}
                                    onChange={(event) =>
                                        setProtectedForm({
                                            ...protectedForm,
                                            amount: event.target.value
                                        })
                                    }
                                    placeholder="Enter payment amount"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm text-slate-300">
                                    Completed voice analysis
                                </label>
                                <select
                                    required
                                    value={protectedForm.voiceAnalysisId}
                                    onChange={(event) =>
                                        setProtectedForm({
                                            ...protectedForm,
                                            voiceAnalysisId: event.target.value
                                        })
                                    }
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
                                >
                                    <option value="">Select a voice analysis</option>
                                    {analyses.map((item) => (
                                        <option key={item._id} value={item._id}>
                                            {item.filename} — {item.verdict} ({item.riskScore ?? "—"}%)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {analyses.length === 0 && (
                                <p className="text-xs text-amber-300">
                                    First complete a voice analysis on the Voice Analysis page.
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={evaluating || analyses.length === 0}
                                className="w-full rounded-xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 font-semibold text-emerald-300 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {evaluating ? "Evaluating..." : "Evaluate transaction risk"}
                            </button>
                        </form>

                        {evaluationResult && (
                            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950 p-4">
                                <p className="text-sm font-semibold">Evaluation result</p>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-slate-500">Decision</p>
                                        <p className={`mt-1 font-bold uppercase ${decisionStyle[evaluationResult.securityDecision] || "text-white"}`}>
                                            {evaluationResult.securityDecision}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Status</p>
                                        <p className="mt-1 font-semibold capitalize">
                                            {evaluationResult.status}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Risk score</p>
                                        <p className="mt-1 font-semibold">
                                            {evaluationResult.riskScore ?? "—"}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Amount</p>
                                        <p className="mt-1 font-semibold">
                                            ₹{Number(evaluationResult.amount).toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm leading-6 text-slate-400">
                                    {evaluationResult.reason}
                                </p>
                                {evaluationResult.verificationStatus === "pending" && (
                                    <p className="mt-3 text-xs text-amber-300">
                                        Additional verification is required before this transaction can be completed.
                                    </p>
                                )}
                            </div>
                        )}
                    </section>
                </div>

                <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold">Transaction history</h3>
                            <p className="mt-1 text-sm text-slate-400">
                                Total recorded amount: ₹{totalAmount.toLocaleString("en-IN")}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadData}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-emerald-400 hover:text-white"
                        >
                            Refresh
                        </button>
                    </div>

                    {loading ? (
                        <p className="py-8 text-center text-sm text-slate-500">
                            Loading transactions...
                        </p>
                    ) : transactions.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-500">
                            No transactions found.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[750px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                                        <th className="px-3 py-4">Transaction</th>
                                        <th className="px-3 py-4">Amount</th>
                                        <th className="px-3 py-4">Decision</th>
                                        <th className="px-3 py-4">Status</th>
                                        <th className="px-3 py-4">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((item) => (
                                        <tr key={item._id} className="border-b border-slate-800/70 last:border-0">
                                            <td className="px-3 py-4">
                                                <p className="font-medium text-slate-200">
                                                    {item.description || item.category || "Transaction"}
                                                </p>
                                                <p className="mt-1 text-xs capitalize text-slate-500">
                                                    {item.type} · {item.paymentMethod}
                                                </p>
                                            </td>
                                            <td className="px-3 py-4 font-semibold tabular-nums">
                                                ₹{Number(item.amount).toLocaleString("en-IN")}
                                            </td>
                                            <td className={`px-3 py-4 text-xs font-bold uppercase ${decisionStyle[item.securityDecision] || "text-slate-400"}`}>
                                                {item.securityDecision || "—"}
                                            </td>
                                            <td className="px-3 py-4">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[item.status] || "bg-slate-800 text-slate-300"}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-4 text-xs text-slate-500">
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
            </main>
        </div>
    );
};

export default Transactions;
