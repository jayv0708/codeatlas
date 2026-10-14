"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { AlertCircle, CheckCircle } from "lucide-react";
import { GithubIcon } from "@/components/ui/github-icon";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";

type AuthMode = "signin" | "signup";

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -80 : 80,
    opacity: 0,
  }),
};

export function AuthForm({ error, verified }: { error: string | null; verified?: boolean }) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [direction, setDirection] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sign-in fields
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Sign-up fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const switchMode = useCallback(
    (next: AuthMode) => {
      if (next === mode) return;
      setDirection(next === "signup" ? 1 : -1);
      setMode(next);
      setClientError(null);
      setSuccessMessage(null);
    },
    [mode],
  );

  const handleGitHub = useCallback(async () => {
    setIsLoading(true);
    setClientError(null);
    try {
      await signIn("github", { callbackUrl: "/dashboard" });
    } catch {
      setClientError("GitHub sign-in could not be started. Please try again.");
      setIsLoading(false);
    }
  }, []);

  const handleGoogle = useCallback(async () => {
    setIsLoading(true);
    setClientError(null);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setClientError("Google sign-in could not be started. Please try again.");
      setIsLoading(false);
    }
  }, []);

  // Manual sign-in
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setClientError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: signInEmail,
        password: signInPassword,
        redirect: false,
      });

      if (result?.error) {
        setClientError("Invalid email or password. Please try again.");
      } else if (result?.ok) {
        window.location.href = "/dashboard";
      }
    } catch {
      setClientError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // Manual sign-up
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setClientError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (signUpPassword.length < 8) {
      setClientError("Password must be at least 8 characters.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: [firstName, lastName].filter(Boolean).join(" ") || null,
          email: signUpEmail,
          password: signUpPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setClientError(data.error || "Failed to create account.");
        return;
      }

      setSuccessMessage(data.message || "Account created. Please check your email to verify your account.");
    } catch {
      setClientError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const displayError = error ?? clientError;

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Mobile logo (hidden on lg+) */}
      <div className="lg:hidden flex justify-center mb-8">
        <div className="w-12 h-12 bg-[#ff4d00] rounded-xl flex items-center justify-center">
          <span className="text-white text-2xl font-bold">C</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center lg:text-left space-y-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.h2
            key={mode}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="text-4xl font-bold tracking-tight text-zinc-100"
          >
            {mode === "signin" ? "Welcome back" : "Join CodeAtlas"}
          </motion.h2>
        </AnimatePresence>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={mode}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut", delay: 0.05 }}
            className="text-zinc-400"
          >
            {mode === "signin"
              ? "Resume your journey through the atlas."
              : "Start building your developer legacy."}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Sign In / Sign Up slider */}
      <div className="bg-zinc-900 p-1 rounded-xl flex border border-zinc-800/50 relative">
        <motion.div
          className="absolute top-1 bottom-1 rounded-lg bg-zinc-800 shadow-sm"
          initial={false}
          animate={{
            left: mode === "signin" ? "4px" : "50%",
            right: mode === "signin" ? "50%" : "4px",
          }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className={`relative z-10 flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            mode === "signin" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`relative z-10 flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            mode === "signup" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Social buttons */}
      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={handleGitHub}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 w-full bg-white text-zinc-900 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <GithubIcon className="h-5 w-5" />
          Continue with GitHub
        </button>
        <button
          type="button"
          onClick={handleGoogle}
          disabled={isLoading}
          className="flex items-center justify-center gap-3 w-full bg-transparent border border-zinc-800 text-zinc-100 py-3 rounded-xl font-medium hover:bg-zinc-900/50 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-zinc-800/80" />
        <span className="flex-shrink mx-4 text-xs font-medium text-zinc-400 uppercase tracking-widest">
          Or with email
        </span>
        <div className="flex-grow border-t border-zinc-800/80" />
      </div>

      {/* Verified success display */}
      {verified && !displayError && !successMessage && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300"
        >
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Your email has been verified. You can now sign in.</span>
        </div>
      )}

      {/* Error display */}
      {displayError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{displayError}</span>
        </div>
      )}

      {/* Success display */}
      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-300"
        >
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Forms */}
      <div className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {mode === "signin" ? (
            <motion.form
              key="signin"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="space-y-4"
              onSubmit={handleSignIn}
            >
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="xyz@gmail.com"
                  className="w-full bg-black border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:ring-[#ff4d00] focus:border-[#ff4d00] rounded-xl py-3 px-4 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-[#ff4d00] font-medium hover:underline"
                  >
                    Forgot?
                  </Link>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:ring-[#ff4d00] focus:border-[#ff4d00] rounded-xl py-3 px-4 outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#ff4d00] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#ff4d00]/20 hover:scale-[1.01] active:scale-[0.98] transition-all mt-4 disabled:opacity-50"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="signup"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="space-y-4"
              onSubmit={handleSignUp}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Name"
                    className="w-full bg-black border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:ring-[#ff4d00] focus:border-[#ff4d00] rounded-xl py-3 px-4 outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full bg-black border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:ring-[#ff4d00] focus:border-[#ff4d00] rounded-xl py-3 px-4 outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="xyz@gmail.com"
                  className="w-full bg-black border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:ring-[#ff4d00] focus:border-[#ff4d00] rounded-xl py-3 px-4 outline-none transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">
                  New Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={8}
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full bg-black border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:ring-[#ff4d00] focus:border-[#ff4d00] rounded-xl py-3 px-4 outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#ff4d00] text-white py-4 rounded-xl font-bold shadow-lg shadow-[#ff4d00]/20 hover:scale-[1.01] active:scale-[0.98] transition-all mt-4 disabled:opacity-50"
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="pt-8 flex flex-col items-center gap-6">
        <div className="flex gap-6 text-zinc-500">
          <a className="hover:text-[#ff4d00] transition-colors" href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M23.954 4.569c-.885.392-1.83.656-2.825.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
            </svg>
          </a>
          <a className="hover:text-[#ff4d00] transition-colors" href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          </a>
          <a className="hover:text-[#ff4d00] transition-colors" href="https://github.com" target="_blank" rel="noopener noreferrer">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3 8h-1.35c-.538 0-.65.221-.65.778v1.222h2l-.209 2h-1.791v7h-3v-7h-2v-2h2v-2.308c0-1.769.931-2.692 3.029-2.692h1.971v3z" />
            </svg>
          </a>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">
          &copy; 2024 CodeAtlas Architecture. All rights reserved.
        </p>
        <Link
          href="/"
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          &larr; Back to home
        </Link>
      </div>
    </div>
  );
}
