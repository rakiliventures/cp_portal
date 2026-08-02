"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ErrorToast } from "@/components/ui/ErrorToast";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      setSubmitted(true);
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <>
      <ErrorToast message={error} onClose={() => setError("")} />

      <div className="flex min-h-screen items-center justify-center bg-white px-4 py-6">
        <div className="w-full max-w-md">
          <div className="card border-primary/20">
            <div className="mb-5 flex flex-col items-center gap-3 sm:mb-6 sm:flex-row sm:justify-center">
              <Image src="/images/logo.jpg" alt="" width={64} height={32} className="h-10 w-auto shrink-0 object-contain" />
              <h1 className="text-xl font-semibold text-primary sm:text-2xl">Forgot password</h1>
            </div>

            {submitted ? (
              <div className="space-y-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <p className="text-sm text-slate-600">
                  If an account exists for <strong>{email.trim()}</strong>, we&apos;ve sent instructions to reset your password.
                  The link will expire in 1 hour.
                </p>
                <Link href="/login" className="inline-block min-h-[44px] py-2 text-sm font-medium text-primary hover:text-primary-dark hover:underline">
                  Back to login
                </Link>
              </div>
            ) : (
              <>
                <p className="mb-5 text-sm text-slate-600">
                  Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
                </p>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
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
                  <button type="submit" disabled={loading} className="btn-primary w-full min-h-[48px]">
                    {loading ? "Sending…" : "Send reset link"}
                  </button>
                </form>
                <p className="mt-5 text-center text-sm text-slate-600">
                  <Link href="/login" className="inline-block min-h-[44px] py-2 text-primary hover:text-primary-dark hover:underline active:opacity-80">
                    Back to login
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
