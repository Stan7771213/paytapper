'use client';

import { useState } from "react";
import Link from "next/link";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, message }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to send message");
      }

      setStatus("success");
      setMessage("");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-24 space-y-24">
      <section className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">Paytapper</h1>
        <p className="text-xl text-gray-500">
          Simple QR-based tipping and small payments for waiters, bartenders, guides, drivers and creators in Europe.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/register" className="rounded-md bg-black px-6 py-3 text-white hover:bg-gray-800">
            Create account
          </Link>
          <Link href="/login" className="rounded-md border border-gray-700 px-6 py-3 text-gray-300 hover:bg-gray-900">
            Log in
          </Link>
        </div>
      </section>

      <section className="flex justify-center">
        <div className="rounded-2xl border border-gray-800 bg-black p-6">
          <img src="/qr-paytapper.svg" alt="Paytapper QR code" className="h-64 w-64" />
        </div>
      </section>

      <section className="text-center space-y-6">
        <h2 className="text-3xl font-semibold">Feedback</h2>
        <p className="text-gray-500">
          Questions, ideas, or issues? Send us a message.
        </p>

        <form onSubmit={submit} className="mx-auto max-w-md space-y-4">
          <input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm"
          />

          <textarea
            required
            placeholder="Your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm h-28"
          />

          {status === "error" && (
            <div className="text-sm text-red-500">{error}</div>
          )}

          {status === "success" && (
            <div className="text-sm text-green-500">Message sent. Thank you.</div>
          )}

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {status === "sending" ? "Sending..." : "Send message"}
          </button>
        </form>
      </section>
    </main>
  );
}
