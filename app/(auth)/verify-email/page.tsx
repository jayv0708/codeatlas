"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AlertCircle, CheckCircle, Mail } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const verified = searchParams.get("verified");
  const error = searchParams.get("error");
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  async function handleResend(e: React.FormEvent) {
    e.preventDefault();
    setResendLoading(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail }),
      });
      const data = await res.json();
      setResendSuccess(true);
    } catch {
      setResendError("Failed to resend. Please try again.");
    } finally {
      setResendLoading(false);
    }
  }

  if (verified) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Email verified</h2>
          <p className="text-zinc-400 mt-2">Your email has been verified. You can now sign in to your account.</p>
        </div>
        <Link
          href="/login"
          className="inline-block w-full bg-[#ff4d00] text-white py-3 rounded-xl font-bold shadow-lg shadow-[#ff4d00]/20 hover:scale-[1.01] transition-all"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">Verification failed</h2>
          <p className="text-zinc-400 mt-2">This verification link is invalid or has expired.</p>
        </div>

        <form onSubmit={handleResend} className="space-y-4 text-left">
          <p className="text-sm text-zinc-400 text-center">Enter your email to resend the verification link:</p>
          <input
            type="email"
            required
            value={resendEmail}
            onChange={(e) => setResendEmail(e.target.value)}
            placeholder="xyz@gmail.com"
            className="w-full bg-black border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:ring-[#ff4d00] focus:border-[#ff4d00] rounded-xl py-3 px-4 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={resendLoading}
            className="w-full bg-[#ff4d00] text-white py-3 rounded-xl font-bold hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            {resendLoading ? "Sending..." : "Resend Verification Email"}
          </button>
          {resendSuccess && (
            <p className="text-sm text-green-300 text-center">
              Verification email sent. Check your inbox.
            </p>
          )}
          {resendError && (
            <p className="text-sm text-red-300 text-center">{resendError}</p>
          )}
        </form>

        <Link href="/login" className="text-sm text-zinc-500 hover:text-zinc-300">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return null;
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen bg-[#0a0a0a] items-center justify-center px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-[#ff4d00] rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">C</span>
            </div>
          </Link>
        </div>
        <Suspense fallback={<div className="text-zinc-500 text-center">Loading...</div>}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
