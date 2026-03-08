"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/app/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setError("Invalid email or password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
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
  );
}
