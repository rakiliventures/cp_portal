"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function InquiryPage() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, contact, email, message }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      setStatus("sent");
      setName("");
      setContact("");
      setEmail("");
      setMessage("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-white px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-md">
        <div className="card border-primary/20">
          <div className="mb-5 flex flex-col items-start gap-2 sm:mb-6 sm:flex-row sm:items-center sm:gap-3">
            <Image src="/images/logo.jpg" alt="" width={56} height={28} className="h-9 w-auto shrink-0 object-contain" />
            <h1 className="text-xl font-semibold text-primary sm:text-2xl">Send an inquiry</h1>
          </div>
          <p className="mb-4 text-slate-600">
            Interested in joining Catholic Professionals? Send your details and we’ll get back to you.
          </p>
          {status === "sent" && (
            <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">
              Thank you. Your inquiry has been sent.
            </p>
          )}
          {status === "error" && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              Something went wrong. Please try again.
            </p>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                required
              />
            </div>
            <div>
              <label htmlFor="contact" className="mb-1 block text-sm font-medium text-slate-700">
                Contact (phone)
              </label>
              <input
                id="contact"
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="input"
                required
              />
            </div>
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
              />
            </div>
            <div>
              <label htmlFor="message" className="mb-1 block text-sm font-medium text-slate-700">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input input-textarea min-h-[120px]"
                rows={4}
              />
            </div>
            <button type="submit" disabled={status === "sending"} className="btn-primary w-full min-h-[48px]">
              {status === "sending" ? "Sending…" : "Send inquiry"}
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
