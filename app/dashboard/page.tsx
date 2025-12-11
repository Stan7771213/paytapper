// app/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import QRCode from "react-qr-code";

type Payment = {
  id?: string;
  amountCents?: number;
  clientAmountCents?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
};

type PaymentsResponse = {
  payments?: Payment[];
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const clientIdFromUrl = searchParams.get("clientId");
  const clientId =
    clientIdFromUrl && clientIdFromUrl.trim().length > 0
      ? clientIdFromUrl.trim()
      : null;

  // onboarding state
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  // payments + stats
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ui helpers
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const qrSvgRef = useRef<SVGSVGElement | null>(null);

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.paytapper.net";

  const tipUrl = clientId
    ? `${baseUrl}/tip?clientId=${encodeURIComponent(clientId)}`
    : null;

  // Load payments when clientId is present
  useEffect(() => {
    if (!clientId) return;

    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/payments/by-client?clientId=${encodeURIComponent(clientId)}`
        );

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const data: PaymentsResponse = await res.json();
        setPayments(data.payments || []);
      } catch (err) {
        console.error("Failed to load payments", err);
        setError("Could not load payments for this client yet.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [clientId]);

  const successfulPayments = payments.filter(
    (p) => (p.status ?? "succeeded") === "succeeded"
  );

  const totalReceivedCents = successfulPayments.reduce(
    (sum, p) => sum + (p.clientAmountCents ?? p.amountCents ?? 0),
    0
  );
  const totalTips = successfulPayments.length;
  const avgTipCents =
    totalTips > 0 ? Math.round(totalReceivedCents / totalTips) : 0;

  const formatMoney = (cents: number | undefined) => {
    if (!cents || cents <= 0) return "€0.00";
    return `€${(cents / 100).toFixed(2)}`;
  };

  const lastPayments = [...successfulPayments]
    .sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    })
    .slice(0, 5);

  const handleCopy = async () => {
    if (!tipUrl) return;
    try {
      await navigator.clipboard.writeText(tipUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  const handleDownloadQR = async () => {
    if (!qrSvgRef.current || !clientId || !tipUrl || downloading) return;

    try {
      setDownloading(true);

      const svg = qrSvgRef.current;
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);

      const svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        const size = 512;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          setDownloading(false);
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);

        URL.revokeObjectURL(url);

        const pngUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `paytapper-qr-${clientId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setDownloading(false);
      };

      img.onerror = (err) => {
        console.error("Failed to generate QR PNG", err);
        URL.revokeObjectURL(url);
        setDownloading(false);
      };

      img.src = url;
    } catch (err) {
      console.error("Error while downloading QR", err);
      setDownloading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!email.trim()) {
      alert("Email is required");
      return;
    }

    setCreating(true);

    try {
      const res = await fetch("/api/clients/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to create client");
        setCreating(false);
        return;
      }

      // redirect to dashboard with new clientId
      window.location.href = `/dashboard?clientId=${encodeURIComponent(
        data.client.id
      )}`;
    } catch (err) {
      console.error("Failed to create client", err);
      alert("Network error while creating client");
      setCreating(false);
    }
  };

  // ============= RENDER =============

  // 1) ONBOARDING: no clientId in URL → show creation form
  if (!clientId) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Create your Paytapper link
          </h1>
          <p className="mt-3 text-slate-300 max-w-xl">
            Enter your email and an optional name. We&apos;ll create your
            personal tip link, QR code and dashboard powered by Stripe.
          </p>

          <div className="mt-8 max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <label className="block mb-4 text-sm">
              <span className="text-slate-200">Email</span>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="block mb-6 text-sm">
              <span className="text-slate-200">Name (optional)</span>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                placeholder="Your name or business name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <button
              onClick={handleCreateClient}
              disabled={creating}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {creating ? "Creating..." : "Create my Paytapper link"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // 2) DASHBOARD: clientId present → show link, stats, QR
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
        {/* Header */}
        <header className="flex flex-col gap-3 md:flex-row md:items-baseline md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              Your Paytapper dashboard
            </h1>
            <p className="mt-2 text-slate-300 max-w-xl">
              You&apos;re viewing stats, tip link and QR code for client{" "}
              <span className="font-mono text-xs bg-slate-900/70 px-1.5 py-0.5 rounded">
                {clientId}
              </span>
              .
            </p>
          </div>
          <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/5 px-3 py-1 text-xs font-medium text-emerald-200">
            Live Stripe ready · Client dashboard
          </span>
        </header>

        <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)]">
          {/* Left column: link + stats */}
          <div className="space-y-6">
            {/* Link card */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-medium text-slate-50">
                Your Paytapper link
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                This is the link guests will use to send tips or small
                payments. Each client has their own link and QR code.
              </p>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
                  <dt className="w-32 text-slate-400">Client ID</dt>
                  <dd className="font-mono text-xs md:text-sm text-emerald-300">
                    {clientId}
                  </dd>
                </div>

                <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
                  <dt className="w-32 text-slate-400">Tip link</dt>
                  <dd className="font-mono text-xs md:text-sm break-all">
                    {tipUrl}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center rounded-full border border-blue-500/60 px-4 py-2 text-sm font-medium text-blue-100 hover:bg-blue-500/10 transition"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>

                {tipUrl && (
                  <Link
                    href={tipUrl.replace(baseUrl, "")}
                    className="inline-flex items-center justify-center rounded-full border border-emerald-500/60 px-4 py-2 text-sm font-medium text-emerald-100 hover:bg-emerald-500/10 transition"
                  >
                    Open tip page
                  </Link>
                )}
              </div>
            </section>

            {/* Stats card */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-medium text-slate-50">
                  Tip stats
                </h2>
                {loading && (
                  <span className="text-xs text-slate-400">Loading…</span>
                )}
              </div>

              {error && (
                <p className="mt-3 text-xs text-rose-300">
                  {error} This doesn&apos;t affect live Stripe payments.
                </p>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800/80">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Total received
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-50">
                    {formatMoney(totalReceivedCents)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Sum of all tips for this client.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800/80">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Number of tips
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-50">
                    {totalTips}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Count of successful payments.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900/80 p-4 border border-slate-800/80">
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    Average tip
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-50">
                    {formatMoney(avgTipCents)}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Based on successful tips only.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-medium text-slate-100">
                  Last tips
                </h3>

                {lastPayments.length === 0 && !loading && !error && (
                  <p className="mt-2 text-xs text-slate-400">
                    No tips yet for this client. Once you start receiving
                    payments, they will appear here.
                  </p>
                )}

                {lastPayments.length > 0 && (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800/80">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400">
                        <tr>
                          <th className="px-3 py-2 font-medium">Date</th>
                          <th className="px-3 py-2 font-medium">Amount</th>
                          <th className="px-3 py-2 font-medium">Currency</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastPayments.map((p, idx) => (
                          <tr
                            key={p.id ?? idx}
                            className="border-t border-slate-800/60"
                          >
                            <td className="px-3 py-2 text-slate-200">
                              {p.createdAt
                                ? new Date(p.createdAt).toLocaleString()
                                : "—"}
                            </td>
                            <td className="px-3 py-2 text-slate-200">
                              {formatMoney(
                                p.clientAmountCents ?? p.amountCents
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-300">
                              {p.currency ?? "EUR"}
                            </td>
                            <td className="px-3 py-2">
                              <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/5 px-2 py-0.5 text-[11px] font-medium text-emerald-200">
                                {p.status ?? "succeeded"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right column: QR */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-medium text-slate-50">
                QR code for your link
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                This QR points to your Paytapper tip page. You can print it on
                tables, flyers or checks.
              </p>

              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800/80">
                  <div className="h-40 w-40 flex items-center justify-center">
                    {tipUrl && (
                      <QRCode
                        value={tipUrl}
                        ref={qrSvgRef as any}
                        style={{
                          height: "auto",
                          maxWidth: "160px",
                          width: "100%",
                        }}
                      />
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 text-center break-all">
                  Tip page URL:
                  <br />
                  {tipUrl}
                </p>

                <button
                  onClick={handleDownloadQR}
                  disabled={downloading}
                  className="mt-1 inline-flex items-center justify-center rounded-full border border-slate-500/70 px-4 py-2 text-xs font-medium text-slate-100 hover:bg-slate-100/5 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {downloading ? "Preparing PNG…" : "Download QR (PNG)"}
                </button>
              </div>
            </section>
          </aside>
        </div>

        <p className="mt-8 text-[11px] text-slate-500">
          Roadmap: real client profiles, Stripe Connect onboarding flow,
          database instead of JSON, exportable reports and multi-language
          support.
        </p>
      </div>
    </main>
  );
}

