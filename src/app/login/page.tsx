"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

function SigningInModal({ progress }: { progress: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-xs rounded-2xl bg-white px-6 py-7 shadow-2xl">
        {/* Spinner + label */}
        <div className="mb-5 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <svg className="h-7 w-7 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700">Signing you in…</p>
          <p className="text-xs text-slate-400">Please wait a moment</p>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-right text-[11px] tabular-nums text-slate-400">{progress}%</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/app/dashboard";
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate progress bar while loading
  useEffect(() => {
    if (loading) {
      setProgress(0);
      let current = 0;
      intervalRef.current = setInterval(() => {
        // Advance quickly to ~85%, then slow down to wait for the real response
        current += current < 40 ? 8 : current < 70 ? 4 : current < 85 ? 1.5 : 0.3;
        if (current >= 92) current = 92; // Hold at 92% until done
        setProgress(Math.round(current));
      }, 120);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // Jump to 100% then hide
      if (progress > 0) setProgress(100);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setProgress(0);
      setError("Invalid email or password.");
      return;
    }
    setProgress(100);
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <>
      {loading && <SigningInModal progress={progress} />}

      <div className="flex min-h-screen items-center justify-center bg-white px-4 py-6">
        <div className="w-full max-w-md">
          <div className="card border-primary/20">
            <div className="mb-5 flex flex-col items-center gap-3 sm:mb-6 sm:flex-row sm:justify-center">
              <Image src="/images/logo.jpg" alt="" width={64} height={32} className="h-10 w-auto shrink-0 object-contain" />
              <h1 className="text-xl font-semibold text-primary sm:text-2xl">Member login</h1>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading} className="btn-primary w-full min-h-[48px]">
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-slate-600">
              <Link href="/" className="inline-block min-h-[44px] py-2 text-primary hover:text-primary-dark hover:underline active:opacity-80">
                Back to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
