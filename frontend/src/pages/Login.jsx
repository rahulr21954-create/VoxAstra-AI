import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

export default function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            setLoading(true);

            const data = await loginUser({
                email: form.email.trim(),
                password: form.password
            });

            if (!data.success || !data.token) {
                setError(data.message || "Login failed.");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            navigate("/dashboard", { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to connect to the server. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070B19] px-4 py-12 text-white">

            {/* Background glow effects */}
            <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />

            <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px]" />

            <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0B1022]/90 shadow-2xl shadow-black/40 lg:grid-cols-2">

                {/* Left visual panel */}
                <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-10 lg:flex xl:p-12">

                    <div className="absolute -right-20 top-24 h-64 w-64 rounded-full border border-white/10" />
                    <div className="absolute -right-10 top-34 h-44 w-44 rounded-full border border-white/10" />
                    <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-purple-400/20 blur-3xl" />

                    <div className="relative z-10 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-xl font-black backdrop-blur">
                            V
                        </div>

                        <div>
                            <h1 className="text-xl font-bold tracking-wide">
                                VoxAstra
                            </h1>
                            <p className="text-xs text-blue-100">
                                AI Security Platform
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 py-12">
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl backdrop-blur">
                            ◈
                        </div>

                        <h2 className="max-w-sm text-4xl font-bold leading-tight xl:text-5xl">
                            Trust every voice.
                            <span className="mt-2 block text-blue-200">
                                Secure every transaction.
                            </span>
                        </h2>

                        <p className="mt-6 max-w-sm text-sm leading-7 text-blue-100/80">
                            Detect suspicious synthetic voices and add
                            an extra layer of protection to sensitive
                            financial transactions.
                        </p>

                        <div className="mt-8 flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs text-white">
                                AI Voice Analysis
                            </span>
                            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs text-white">
                                Fraud Detection
                            </span>
                        </div>
                    </div>

                    <p className="relative z-10 text-xs text-blue-100/60">
                        Intelligent voice security · VoxAstra AI
                    </p>
                </section>

                {/* Login form */}
                <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
                    <div className="w-full max-w-md">

                        <div className="mb-8 lg:hidden">
                            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-black shadow-lg shadow-blue-500/20">
                                V
                            </div>

                            <h1 className="text-2xl font-bold">
                                VoxAstra
                            </h1>
                            <p className="mt-1 text-sm text-slate-400">
                                AI Security Platform
                            </p>
                        </div>

                        <div className="mb-8">
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">
                                Welcome back
                            </p>

                            <h2 className="text-3xl font-bold tracking-tight">
                                Sign in to your account
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-slate-400">
                                Access your voice security and fraud monitoring dashboard.
                            </p>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="mb-5 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-300"
                            >
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">

                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Email address
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="name@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:bg-blue-500/[0.05] focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Password
                                </label>

                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:bg-blue-500/[0.05] focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-900/30 transition hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#0B1022] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? "Signing in..." : "Sign in →"}
                            </button>
                        </form>

                        <div className="my-7 flex items-center gap-4">
                            <div className="h-px flex-1 bg-white/10" />
                            <span className="text-xs text-slate-500">
                                NEW TO VOXASTRA?
                            </span>
                            <div className="h-px flex-1 bg-white/10" />
                        </div>

                        <Link
                            to="/signup"
                            className="block w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-center text-sm font-medium text-slate-200 transition hover:border-blue-400/40 hover:bg-blue-500/[0.07]"
                        >
                            Create an account
                        </Link>

                        <p className="mt-8 text-center text-xs text-slate-600">
                            Secure authentication · VoxAstra AI
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}