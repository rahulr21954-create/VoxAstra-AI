
import { useState } from "react";
import {
  createVerification,
  verifyOtp,
} from "../services/verificationService";

export default function Verification() {
  const [transactionId, setTransactionId] = useState("");
  const [otp, setOtp] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("create");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);

  const handleCreate = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");
    setVerified(false);
    setChallengeId("");
    setExpiresAt("");
    setOtp("");
    setStep("create");

    try {
      const data = await createVerification({
        transactionId: transactionId.trim(),
      });

      // Backend returns challengeId at the top level.
      const result = data?.data ?? data;
      const newChallengeId =
        result.challengeId ||
        result.verification?.challengeId ||
        result.verification?._id ||
        result.verificationId;

      if (!newChallengeId) {
        throw new Error(
          "Challenge ID missing from backend response."
        );
      }

      setChallengeId(newChallengeId);
      setExpiresAt(result.expiresAt || "");
      setStep("verify");

      // Development OTP is only available outside production
      // if the backend explicitly returns demoOtp.
      if (result.demoOtp) {
        setOtp(String(result.demoOtp));
        setMessage(
          "Verification created. Development OTP filled automatically."
        );
      } else {
        setMessage(
          result.message ||
            "Verification created. Enter the OTP from your configured delivery channel."
        );
      }
    } catch (err) {
      console.error(
        "CREATE VERIFICATION ERROR:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not create verification."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    if (!challengeId) {
      setError("Create a verification challenge first.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError("Enter a valid six-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setVerified(false);

    try {
      // Backend expects challengeId and otp.
      const data = await verifyOtp({
        challengeId,
        otp,
      });

      setVerified(true);
      setMessage(
        data?.message ||
          "Verification successful."
      );
      setOtp("");
      setStep("done");
    } catch (err) {
      console.error(
        "VERIFY OTP ERROR:",
        err.response?.data || err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "OTP verification failed."
      );
    } finally {
      setLoading(false);
    }
  };

  const resetVerification = () => {
    setChallengeId("");
    setExpiresAt("");
    setOtp("");
    setMessage("");
    setError("");
    setVerified(false);
    setStep("create");
  };

  return (
    <div className="min-h-screen bg-[#07100D] text-white lg:flex">
      <aside className="hidden w-64 shrink-0 border-r border-emerald-900/50 bg-[#0A1511] p-6 lg:block">
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
            <a
              key={path}
              href={path}
              className={`block rounded-xl px-4 py-3 text-sm transition ${
                path === "/verification"
                  ? "bg-emerald-500/15 font-semibold text-emerald-300"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {label}
            </a>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-5 sm:p-8 lg:p-12">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-medium tracking-widest text-emerald-400">
            IDENTITY & TRANSACTION SECURITY
          </p>

          <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
            OTP Verification
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-400">
            Verify a transaction requiring additional security.
          </p>

          {(message || error) && (
            <div
              className={`mt-6 rounded-xl border p-4 text-sm ${
                error
                  ? "border-red-800 bg-red-950/30 text-red-300"
                  : "border-emerald-800 bg-emerald-950/30 text-emerald-300"
              }`}
              role={error ? "alert" : "status"}
            >
              {error || message}
            </div>
          )}

          <section className="mt-8 rounded-2xl border border-emerald-900/60 bg-[#0C1814] p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
                🔐
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Step 1 — Start verification
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  Enter the transaction ID associated with this request.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <div>
                <label
                  htmlFor="transactionId"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Transaction ID
                </label>

                <input
                  id="transactionId"
                  value={transactionId}
                  onChange={(event) => {
                    setTransactionId(event.target.value);
                    setError("");
                  }}
                  placeholder="TXN-... or transaction ID"
                  required
                  disabled={loading || step === "verify"}
                  className="w-full rounded-xl border border-gray-700 bg-[#07100D] px-4 py-3 outline-none transition placeholder:text-gray-600 focus:border-emerald-500 disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  !transactionId.trim() ||
                  step === "verify"
                }
                className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-[#07100D] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {loading
                  ? "Processing..."
                  : step === "verify"
                  ? "Challenge Created"
                  : "Create Verification"}
              </button>
            </form>

            <div className="my-8 border-t border-emerald-900/50" />

            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-2xl">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  Step 2 — Verify OTP
                </h3>
                <p className="mt-1 text-sm text-gray-400">
                  Enter the six-digit OTP for this challenge.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label
                  htmlFor="otp"
                  className="mb-2 block text-sm text-gray-300"
                >
                  One-time password
                </label>

                <input
                  id="otp"
                  value={otp}
                  onChange={(event) => {
                    setOtp(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6)
                    );
                    setError("");
                  }}
                  placeholder="Enter 6-digit OTP"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  required
                  disabled={
                    loading ||
                    !challengeId ||
                    verified
                  }
                  className="w-full rounded-xl border border-gray-700 bg-[#07100D] px-4 py-3 tracking-[0.3em] outline-none transition placeholder:tracking-normal placeholder:text-gray-600 focus:border-emerald-500 disabled:opacity-60"
                />
              </div>

              {expiresAt && (
                <p className="text-xs text-gray-500">
                  Challenge expires:{" "}
                  {new Date(expiresAt).toLocaleString()}
                </p>
              )}

              <button
                type="submit"
                disabled={
                  loading ||
                  !challengeId ||
                  !/^\d{6}$/.test(otp) ||
                  verified
                }
                className="w-full rounded-xl border border-emerald-600 px-5 py-3 font-semibold text-emerald-300 transition hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            {verified && (
              <div className="mt-6 rounded-xl border border-emerald-700/50 bg-emerald-500/10 p-4">
                <p className="font-semibold text-emerald-300">
                  Verification successful
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  {message}
                </p>
              </div>
            )}

            {step !== "create" && (
              <button
                type="button"
                onClick={resetVerification}
                disabled={loading}
                className="mt-6 text-sm text-emerald-400 underline underline-offset-4 hover:text-emerald-300 disabled:opacity-50"
              >
                Start another verification
              </button>
            )}
          </section>

          <p className="mt-5 text-xs leading-5 text-gray-500">
            OTPs must be short-lived, single-use, and rate-limited.
            Never expose real OTPs in production API responses or logs.
          </p>
        </div>
      </main>
    </div>
  );
}
