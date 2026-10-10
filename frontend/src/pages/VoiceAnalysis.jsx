
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
    analyzeVoice,
    getVoiceAnalyses,
    uploadVoice
} from "../services/voiceService";

const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleString("en-IN");
};

const verdictStyles = {
    legitimate: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    suspicious: "bg-amber-400/10 text-amber-300 border-amber-400/20",
    fraud: "bg-red-400/10 text-red-400 border-red-400/20",
    unknown: "bg-slate-700 text-slate-300 border-slate-600"
};

const VoiceAnalysis = () => {
    const fileInputRef = useRef(null);

    const [file, setFile] = useState(null);
    const [analyses, setAnalyses] = useState([]);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadAnalyses = async () => {
        try {
            const data = await getVoiceAnalyses();
            setAnalyses(data.analyses || []);
        } catch (err) {
            console.error("VOICE HISTORY ERROR:", err);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        loadAnalyses();
    }, []);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files?.[0];

        setError("");
        setMessage("");
        setResult(null);

        if (!selectedFile) return;

        const allowedTypes = [
            "audio/wav",
            "audio/x-wav",
            "audio/mpeg",
            "audio/mp3",
            "audio/flac",
            "audio/x-flac",
            "audio/mp4",
            "audio/webm",
            "video/mp4"
        ];

        const extensionAllowed =
            /\.(wav|mp3|flac|m4a|mp4|webm)$/i.test(
                selectedFile.name
            );

        if (
            !allowedTypes.includes(selectedFile.type) &&
            !extensionAllowed
        ) {
            setError(
                "Please select a supported WAV, MP3, FLAC, M4A, MP4 or WebM file."
            );
            setFile(null);
            event.target.value = "";
            return;
        }

        if (selectedFile.size > 25 * 1024 * 1024) {
            setError("File size must not exceed 25 MB.");
            setFile(null);
            event.target.value = "";
            return;
        }

        setFile(selectedFile);
    };

    const handleAnalyze = async () => {
        if (!file) {
            setError("Please select an audio file first.");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");
        setResult(null);

        try {
            const uploadData = await uploadVoice(file);
            const analysisId = uploadData.analysis?.id;

            if (!analysisId) {
                throw new Error(
                    "Upload succeeded, but the analysis ID was not returned."
                );
            }

            setMessage("Upload complete. Analyzing voice...");

            const analysisData = await analyzeVoice(analysisId);

            setResult({
                ...analysisData.analysis,
                alertCreated: analysisData.alertCreated
            });

            setMessage(
                analysisData.message ||
                "Voice analysis completed."
            );

            setFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            await loadAnalyses();
        }  catch (err) {
    const responseData = err.response?.data;

    const serverMessage =
        responseData?.details ||
        responseData?.error ||
        responseData?.message ||
        err.message ||
        "Voice analysis failed. Please try again.";

    console.error("VOICE ANALYSIS ERROR:", {
        status: err.response?.status,
        data: responseData,
        url: err.config?.url
    });

    setError(serverMessage);
    setMessage("");

    await loadAnalyses();
} finally {
    setLoading(false);
} 
    };

    const riskScore = Number(result?.riskScore);

    const riskColor =
        riskScore >= 75
            ? "bg-red-400"
            : riskScore >= 45
                ? "bg-amber-400"
                : "bg-emerald-400";

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

                <p className="mb-3 px-3 text-[10px] font-bold tracking-[0.2em] text-slate-600">
                    SECURITY CENTER
                </p>

                <nav className="space-y-2">
                    <Link
                        to="/dashboard"
                        className="block rounded-xl px-4 py-3 text-sm text-slate-400 transition hover:bg-slate-900 hover:text-white"
                    >
                        Overview
                    </Link>

                    <Link
                        to="/voice"
                        className="block rounded-xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950"
                    >
                        Voice Analysis
                    </Link>
                </nav>

                <div className="mt-auto rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                    <p className="text-sm font-semibold text-emerald-300">
                        Voice Protection
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                        Analyze voice samples and review model risk predictions.
                    </p>
                </div>
            </aside>

            <main className="min-w-0 p-5 sm:p-8 md:ml-64 md:p-10">
                <header className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
                            Voice intelligence
                        </p>

                        <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                            Voice Analysis
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                            Detect potentially synthetic or cloned voices.
                        </p>
                    </div>

                    <Link
                        to="/dashboard"
                        className="w-fit rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-slate-300 transition hover:border-emerald-400 hover:text-white"
                    >
                        ← Dashboard
                    </Link>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
                    >
                        {error}
                    </div>
                )}

                {message && !error && (
                    <div
                        role="status"
                        className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-300"
                    >
                        {message}
                    </div>
                )}

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold">
                                Analyze a voice sample
                            </h3>
                            <p className="mt-1 text-sm text-slate-400">
                                Choose an audio file to run the analysis pipeline.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            className="flex min-h-52 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-6 text-center transition hover:border-emerald-400/70 hover:bg-emerald-400/5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-3xl text-emerald-400">
                                ♫
                            </span>

                            <span className="font-semibold">
                                {file ? file.name : "Choose an audio file"}
                            </span>

                            <span className="mt-2 text-xs text-slate-500">
                                WAV, MP3, FLAC, M4A, MP4 or WebM · Max 25 MB
                            </span>

                            {file && (
                                <span className="mt-3 text-xs text-emerald-400">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB selected
                                </span>
                            )}
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".wav,.mp3,.flac,.m4a,.mp4,.webm,audio/*,video/mp4"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        <button
                            type="button"
                            onClick={handleAnalyze}
                            disabled={!file || loading}
                            className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl bg-emerald-400 px-5 py-3.5 font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                        >
                            {loading && (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-slate-950" />
                            )}

                            {loading ? "Analyzing voice..." : "Upload & Analyze"}
                        </button>

                        <p className="mt-4 text-xs leading-5 text-slate-500">
                            Only upload audio you are authorized to analyze. Results are model estimates, not definitive proof of fraud.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
                        <div className="mb-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                Analysis result
                            </p>
                            <h3 className="mt-2 text-lg font-semibold">
                                Risk assessment
                            </h3>
                        </div>

                        {!result ? (
                            <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-center">
                                <span className="text-4xl text-slate-700">◉</span>
                                <p className="mt-4 text-sm font-medium text-slate-300">
                                    No new results yet
                                </p>
                                <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
                                    Upload a voice sample to see its risk score and classification.
                                </p>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-slate-400">
                                        Risk score
                                    </span>

                                    <span className="text-3xl font-bold tabular-nums">
                                        {Number.isFinite(riskScore)
                                            ? `${riskScore.toFixed(1)}%`
                                            : "—"}
                                    </span>
                                </div>

                                <div
                                    className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800"
                                    role="progressbar"
                                    aria-label="Voice risk score"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={
                                        Number.isFinite(riskScore)
                                            ? Math.max(0, Math.min(100, riskScore))
                                            : 0
                                    }
                                >
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${riskColor}`}
                                        style={{
                                            width: `${Math.max(0, Math.min(100, Number.isFinite(riskScore) ? riskScore : 0))}%`
                                        }}
                                    />
                                </div>

                                <div className="mt-2 flex justify-between text-[10px] text-slate-500">
                                    <span>LOW RISK</span>
                                    <span>HIGH RISK</span>
                                </div>

                                <div className="mt-7 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                                    <p className="text-xs text-slate-500">
                                        Model classification
                                    </p>

                                    <span
                                        className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${
                                            verdictStyles[result.verdict] ||
                                            verdictStyles.unknown
                                        }`}
                                    >
                                        {result.verdict || "unknown"}
                                    </span>

                                    <p className="mt-3 text-xs leading-5 text-slate-400">
                                        {result.verdict === "fraud"
                                            ? "High synthetic-voice risk. Apply additional verification before taking action."
                                            : result.verdict === "suspicious"
                                                ? "Potentially suspicious characteristics. Review and verify independently."
                                                : "The model classified this sample as lower risk; this does not guarantee authenticity."}
                                    </p>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-slate-950/70 p-3">
                                        <p className="text-xs text-slate-500">Status</p>
                                        <p className="mt-2 text-sm font-semibold capitalize">
                                            {result.status || "completed"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-950/70 p-3">
                                        <p className="text-xs text-slate-500">Fraud alert</p>
                                        <p className="mt-2 text-sm font-semibold">
                                            {result.alertCreated ? "Created" : "Not created"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </div>

                <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-7">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Recent voice analyses
                            </h3>
                            <p className="mt-1 text-sm text-slate-400">
                                Previous uploads associated with your account.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadAnalyses}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-emerald-400 hover:text-white"
                        >
                            Refresh
                        </button>
                    </div>

                    {historyLoading ? (
                        <p className="py-8 text-center text-sm text-slate-500">
                            Loading analysis history...
                        </p>
                    ) : analyses.length === 0 ? (
                        <p className="py-8 text-center text-sm text-slate-500">
                            No voice analyses found.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[650px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                                        <th className="px-3 py-4 font-medium">Filename</th>
                                        <th className="px-3 py-4 font-medium">Risk score</th>
                                        <th className="px-3 py-4 font-medium">Verdict</th>
                                        <th className="px-3 py-4 font-medium">Status</th>
                                        <th className="px-3 py-4 font-medium">Date</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {analyses.map((item) => (
                                        <tr
                                            key={item._id}
                                            className="border-b border-slate-800/70 last:border-0"
                                        >
                                            <td className="max-w-52 truncate px-3 py-4 font-medium text-slate-200">
                                                {item.filename}
                                            </td>

                                            <td className="px-3 py-4 tabular-nums">
                                                {item.riskScore == null
                                                    ? "—"
                                                    : `${Number(item.riskScore).toFixed(1)}%`}
                                            </td>

                                            <td className="px-3 py-4">
                                                <span
                                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${
                                                        verdictStyles[item.verdict] ||
                                                        verdictStyles.unknown
                                                    }`}
                                                >
                                                    {item.verdict || "unknown"}
                                                </span>
                                            </td>

                                            <td className="px-3 py-4 capitalize text-slate-400">
                                                {item.status}
                                            </td>

                                            <td className="px-3 py-4 text-xs text-slate-500">
                                                {formatDate(item.createdAt)}
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

export default VoiceAnalysis;
