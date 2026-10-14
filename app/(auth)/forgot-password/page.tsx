"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-[#ff4d00] rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">C</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Reset your password</h1>
          <p className="text-zinc-400 mt-2">
            Enter the email address associated with your account and we&apos;ll send you a reset link.
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly. Check your inbox and spam folder.
              </span>
            </div>
            <Link
              href="/login"
              className="block w-full text-center bg-zinc-900 border border-zinc-800 text-zinc-100 py-3 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="xyz@gmail.com"
                className="w-full bg-black border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:ring-[#ff4d00] focus:border-[#ff4d00] rounded-xl py-3 px-4 outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#ff4d00] text-white py-3 rounded-xl font-bold shadow-lg shadow-[#ff4d00]/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>

            <p className="text-center text-sm text-zinc-500">
              <Link href="/login" className="text-[#ff4d00] hover:underline">
                Back to Sign In
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
