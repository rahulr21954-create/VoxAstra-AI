import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

export default function Signup() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (form.password.length < 6) {
            setError("Password must contain at least 6 characters.");
            return;
        }

        try {
            setLoading(true);

            const data = await registerUser({
                name: form.name.trim(),
                email: form.email.trim(),
                password: form.password
            });

            if (!data.success) {
                setError(data.message || "Registration failed.");
                return;
            }

            navigate("/login", {
                replace: true,
                state: {
                    message: "Account created successfully. Please sign in."
                }
            });
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
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070B19] px-4 py-10 text-white">

            {/* Background effects */}
            <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-purple-600/20 blur-[130px]" />

            <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-cyan-500/15 blur-[130px]" />

            <div className="relative z-10 grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0B1022]/90 shadow-2xl shadow-black/40 lg:grid-cols-2">

                {/* Left branding panel */}
                <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700 p-10 lg:flex xl:p-12">

                    <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full border border-white/10" />

                    <div className="absolute -right-8 top-0 h-52 w-52 rounded-full border border-white/10" />

                    <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />

                    <div className="relative z-10 flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-xl font-black">
                            V
                        </div>

                        <div>
                            <h1 className="text-xl font-bold">
                                VoxAstra
                            </h1>

                            <p className="text-xs text-indigo-100">
                                AI Security Platform
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 py-12">
                        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl">
                            ✦
                        </div>

                        <h2 className="max-w-sm text-4xl font-bold leading-tight xl:text-5xl">
                            Build trust.
                            <span className="mt-2 block text-cyan-200">
                                Stop voice fraud.
                            </span>
                        </h2>

                        <p className="mt-6 max-w-sm text-sm leading-7 text-indigo-100/80">
                            Create your account to access AI-powered voice
                            analysis and transaction security tools.
                        </p>

                        <div className="mt-8 space-y-4">
                            {[
                                "Voice fraud risk analysis",
                                "Transaction security monitoring",
                                "Centralized fraud alerts"
                            ].map((feature) => (
                                <div
                                    key={feature}
                                    className="flex items-center gap-3 text-sm text-white/90"
                                >
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs text-cyan-200">
                                        ✓
                                    </span>

                                    {feature}
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="relative z-10 text-xs text-indigo-100/60">
                        Intelligent voice security · VoxAstra AI
                    </p>
                </section>

                {/* Signup form */}
                <section className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
                    <div className="w-full max-w-md">

                        <div className="mb-8 lg:hidden">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 text-xl font-black">
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
                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-purple-400">
                                Get started
                            </p>

                            <h2 className="text-3xl font-bold tracking-tight">
                                Create your account
                            </h2>

                            <p className="mt-3 text-sm leading-6 text-slate-400">
                                Join VoxAstra and start securing your transactions.
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
                                    htmlFor="name"
                                    className="mb-2 block text-sm font-medium text-slate-300"
                                >
                                    Full name
                                </label>

                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    placeholder="Enter your full name"
                                    value={form.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500 focus:bg-purple-500/[0.05] focus:ring-4 focus:ring-purple-500/10"
                                />
                            </div>

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
                                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500 focus:bg-purple-500/[0.05] focus:ring-4 focus:ring-purple-500/10"
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
                                    autoComplete="new-password"
                                    placeholder="At least 6 characters"
                                    value={form.password}
                                    onChange={handleChange}
                                    minLength={6}
                                    required
                                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500 focus:bg-purple-500/[0.05] focus:ring-4 focus:ring-purple-500/10"
                                />

                                <p className="mt-2 text-xs text-slate-500">
                                    Use at least 6 characters.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-purple-900/30 transition hover:from-purple-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-[#0B1022] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? "Creating account..." : "Create account →"}
                            </button>
                        </form>

                        <p className="mt-7 text-center text-sm text-slate-400">
                            Already have an account?{" "}
                            <Link
                                to="/login"
                                className="font-semibold text-purple-400 transition hover:text-purple-300"
                            >
                                Sign in
                            </Link>
                        </p>

                        <p className="mt-8 text-center text-xs text-slate-600">
                            Secure authentication · VoxAstra AI
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}