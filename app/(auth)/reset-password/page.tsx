"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>This reset link is invalid. Please request a new one.</span>
        </div>
        <Link
          href="/forgot-password"
          className="block w-full text-center bg-[#ff4d00] text-white py-3 rounded-xl font-bold hover:scale-[1.01] transition-all"
        >
          Request New Link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Password has been reset successfully. Redirecting to sign in...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">
          New Password
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          className="w-full bg-black border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:ring-[#ff4d00] focus:border-[#ff4d00] rounded-xl py-3 px-4 outline-none transition-colors"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">
          Confirm Password
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat password"
          className="w-full bg-black border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:ring-[#ff4d00] focus:border-[#ff4d00] rounded-xl py-3 px-4 outline-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#ff4d00] text-white py-3 rounded-xl font-bold shadow-lg shadow-[#ff4d00]/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
      >
        {isLoading ? "Resetting..." : "Reset Password"}
      </button>

      <p className="text-center text-sm text-zinc-500">
        <Link href="/login" className="text-[#ff4d00] hover:underline">
          Back to Sign In
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a] items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-[#ff4d00] rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">C</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Set new password</h1>
          <p className="text-zinc-400 mt-2">Choose a strong password for your account.</p>
        </div>
        <Suspense fallback={<div className="text-zinc-500 text-center">Loading...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
