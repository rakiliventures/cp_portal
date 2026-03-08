"use client";

import { useState } from "react";

const inputBase =
  "w-full min-h-[44px] rounded-xl border border-slate-300 bg-white pl-11 pr-3 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0";

export function JoinUsForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact: phone, email, message }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setStatus("sent");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md sm:p-6 md:p-8">
      <h3 className="mb-2 text-xl font-bold text-slate-800 sm:text-2xl">Join Our Community</h3>
      <p className="mb-6 text-sm text-slate-600 sm:text-base">
        Interested in becoming a member? Send us your inquiry and we&apos;ll get back to you.
      </p>
      {status === "sent" && (
        <div className="mb-6 rounded-xl bg-green-50 p-4 text-sm text-green-800">
          Thank you. Your inquiry has been sent.
        </div>
      )}
      {status === "error" && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          Something went wrong. Please try again.
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="join-name" className="mb-1.5 block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <input
              id="join-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputBase}
              placeholder="Enter your full name."
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="join-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Email Address
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
            <input
              id="join-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputBase}
              placeholder="your.email@example.com"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="join-phone" className="mb-1.5 block text-sm font-medium text-slate-700">
            Phone Number
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </span>
            <input
              id="join-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputBase}
              placeholder="+254 XXX XXX XXX"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="join-message" className="mb-1.5 block text-sm font-medium text-slate-700">
            Message
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-4 text-slate-400" aria-hidden>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </span>
            <textarea
              id="join-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`${inputBase} min-h-[120px] resize-y pl-11 pt-3`}
              placeholder="Tell us about your profession and why you'd like to join..."
              rows={4}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={status === "sending"}
          className="w-full min-h-[48px] rounded-xl bg-primary px-4 py-3 font-semibold text-white shadow-md transition hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-70"
        >
          {status === "sending" ? "Sending…" : "Send Inquiry"}
        </button>
      </form>
    </div>
  );
}
