"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { AlertCircle } from "lucide-react";

import { GithubIcon } from "@/components/ui/github-icon";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/site/logo";

export function LoginForm({ error }: { error: string | null }) {
  const [isLoading, setIsLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const handleSignIn = useCallback(async () => {
    setIsLoading(true);
    setClientError(null);
    try {
      await signIn("github", { callbackUrl: "/dashboard" });
      // On success Auth.js redirects the browser; on failure it returns.
    } catch {
      setClientError("GitHub sign-in could not be started. Please try again.");
      setIsLoading(false);
    }
  }, []);

  const displayError = error ?? clientError;

  return (
    <div className="w-full max-w-sm">
      <div className="flex flex-col items-center text-center">
        <LogoMark className="h-10 w-10" />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-slate-50">
          Sign in to CodeAtlas
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Connect GitHub to start understanding your software system.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
        {displayError ? (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{displayError}</span>
          </div>
        ) : null}

        <Button
          type="button"
          onClick={handleSignIn}
          isLoading={isLoading}
          className="w-full bg-indigo-500 text-white hover:bg-indigo-400"
          size="lg"
        >
          <GithubIcon className="h-4 w-4" />
          Continue with GitHub
        </Button>

        <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
          By continuing you agree to our{" "}
          <Link href="/privacy" className="text-indigo-400 underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          . We only request the GitHub permissions needed to sign you in.
        </p>
      </div>
    </div>
  );
}
