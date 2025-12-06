"use client";

import { useEffect, useState } from "react";

type DemoUser = {
  userId: string;
  email: string;
  createdAt: string;
};

type StripeStatus = {
  connected: boolean;
  stripeAccountId?: string;
};

type PaymentStats = {
  clientId: string;
  count: number;
  totalAmount: number; // cents
  totalClientAmount: number; // cents
  totalPlatformFee: number; // cents
};

export default function DashboardPage() {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [origin, setOrigin] = useState<string>("");
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [isStripeChecking, setIsStripeChecking] = useState(false);
  const [isStripeConnecting, setIsStripeConnecting] = useState(false);
  const [isStripeLoginLoading, setIsStripeLoginLoading] = useState(false);

  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    // Read demo user from localStorage
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
      try {
        const raw = window.localStorage.getItem("paytapperUser");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.userId && parsed.email) {
            setUser(parsed);
          }
        }
      } catch (error) {
        console.error("Failed to read paytapperUser from localStorage", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    async function fetchStripeStatus() {
      try {
        setIsStripeChecking(true);
        const resp = await fetch("/api/connect/status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ clientId: user.userId }),
        });

        if (!resp.ok) {
          console.warn("Failed to fetch Stripe status");
          setStripeStatus({ connected: false });
          return;
        }

        const data = await resp.json();
        setStripeStatus({
          connected: !!data.connected,
          stripeAccountId: data.stripeAccountId,
        });
      } catch (error) {
        console.error("Error checking Stripe status:", error);
        setStripeStatus({ connected: false });
      } finally {
        setIsStripeChecking(false);
      }
    }

    fetchStripeStatus();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      try {
        setIsStatsLoading(true);
        setStatsError(null);

        const resp = await fetch("/api/payments/by-client", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ clientId: user.userId }),
        });

        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load stats");
        }

        const data = await resp.json();
        setStats({
          clientId: data.clientId,
          count: data.count,
          totalAmount: data.totalAmount,
          totalClientAmount: data.totalClientAmount,
          totalPlatformFee: data.totalPlatformFee,
        });
      } catch (error: any) {
        console.error("Error loading stats:", error);
        setStatsError(error.message || "Failed to load statistics");
      } finally {
        setIsStatsLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  if (!user) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">
          No user session found. Please go back to the{" "}
          <a href="/auth" className="underline">
            sign-in page
          </a>
          .
        </p>
      </main>
    );
  }

  const tipLink = origin ? `${origin}/tip/${user.userId}` : "";

  const onConnectStripe = async () => {
    if (!user) return;
    try {
      setIsStripeConnecting(true);
      const resp = await fetch("/api/connect/onboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: user.userId,
          email: user.email,
        }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.url) {
        console.error("Failed to create onboarding link", data);
        alert("Failed to start Stripe onboarding. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Error starting Stripe onboarding:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsStripeConnecting(false);
    }
  };

  const onOpenStripeDashboard = async () => {
    if (!user) return;
    try {
      setIsStripeLoginLoading(true);
      const resp = await fetch("/api/stripe/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientId: user.userId }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.url) {
        console.error("Failed to create Stripe login link", data);
        alert("Failed to open Stripe dashboard. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Error opening Stripe dashboard:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsStripeLoginLoading(false);
    }
  };

  const formatEuro = (cents: number) =>
    (cents / 100).toLocaleString("en-GB", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <main className="min-h-screen bg-black text-white flex justify-center px-4 py-8">
      <div className="w-full max-w-3xl space-y-6">
        <header className="flex flex-col gap-1">
          <p className="text-xs text-gray-500">
            Signed in as: <span className="font-mono">{user.email}</span>
          </p>
          <h1 className="text-2xl font-bold mt-1">Client dashboard</h1>
          <p className="text-sm text-gray-400">
            Manage your profile, payment links and payouts (demo version).
          </p>
        </header>

        {/* Profile / placeholder */}
        <section className="rounded-2xl border border-gray-800 bg-gray-950/80 p-4 space-y-2">
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="text-sm text-gray-400">
            In the future you will be able to upload your photo and set your
            workplace or venue name here.
          </p>
          <p className="text-xs text-gray-500">
            Profile editing is coming soon.
          </p>
        </section>

        {/* QR & payment link */}
        <section className="rounded-2xl border border-gray-800 bg-gray-950/80 p-4 space-y-3">
          <h2 className="text-lg font-semibold">My QR &amp; payment link</h2>
          <p className="text-sm text-gray-400">
            This is your personal payment link for tips. You can show the QR
            code to your customers or share the URL directly.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="bg-white p-2 rounded-xl">
              {tipLink ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    tipLink
                  )}`}
                  alt="Paytapper QR code"
                  className="rounded-lg"
                />
              ) : (
                <div className="w-[180px] h-[180px] flex items-center justify-center text-xs text-gray-500">
                  Loading QR…
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2 w-full">
              <p className="text-xs text-gray-400">Payment link</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={tipLink || "Loading…"}
                  className="flex-1 rounded-xl border border-gray-800 bg-black/40 px-3 py-2 text-xs font-mono text-gray-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!tipLink) return;
                    navigator.clipboard
                      .writeText(tipLink)
                      .catch((err) =>
                        console.error("Failed to copy link:", err)
                      );
                  }}
                  className="px-3 py-2 rounded-xl bg-white text-black text-xs font-semibold"
                  disabled={!tipLink}
                >
                  Copy link
                </button>
              </div>
              {tipLink && (
                <p className="text-[11px] text-gray-500">
                  Scan the QR code or open the link to test your tip page.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Stripe payouts */}
        <section className="rounded-2xl border border-gray-800 bg-gray-950/80 p-4 space-y-3">
          <h2 className="text-lg font-semibold">Stripe payouts</h2>
          <p className="text-sm text-gray-400">
            Connect your Stripe account to receive payouts directly. You can
            also open your Stripe dashboard to manage payout details.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm">
              {isStripeChecking && (
                <p className="text-gray-400">Checking Stripe connection…</p>
              )}
              {!isStripeChecking && stripeStatus?.connected && (
                <p className="text-emerald-400">
                  Connected to Stripe{" "}
                  {stripeStatus.stripeAccountId && (
                    <span className="font-mono">
                      ({stripeStatus.stripeAccountId})
                    </span>
                  )}
                </p>
              )}
              {!isStripeChecking && !stripeStatus?.connected && (
                <p className="text-amber-400">Not connected to Stripe yet.</p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onConnectStripe}
                disabled={isStripeConnecting}
                className="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStripeConnecting ? "Connecting…" : "Connect Stripe"}
              </button>

              <button
                type="button"
                onClick={onOpenStripeDashboard}
                disabled={!stripeStatus?.connected || isStripeLoginLoading}
                className="px-4 py-2 rounded-xl border border-gray-700 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStripeLoginLoading
                  ? "Opening dashboard…"
                  : "Open Stripe dashboard"}
              </button>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="rounded-2xl border border-gray-800 bg-gray-950/80 p-4 space-y-3">
          <h2 className="text-lg font-semibold">Statistics</h2>
          <p className="text-sm text-gray-400">
            In this demo we show total number of tips and amounts based on
            successful payments recorded via Stripe webhooks.
          </p>

          {isStatsLoading && (
            <p className="text-sm text-gray-400">Loading statistics…</p>
          )}

          {statsError && (
            <p className="text-sm text-red-400">{statsError}</p>
          )}

          {!isStatsLoading && !statsError && stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-gray-800 bg-black/30 p-3">
                <p className="text-xs text-gray-500">Total tips</p>
                <p className="text-xl font-semibold mt-1">{stats.count}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-black/30 p-3">
                <p className="text-xs text-gray-500">Total amount (gross)</p>
                <p className="text-xl font-semibold mt-1">
                  {formatEuro(stats.totalAmount)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-black/30 p-3">
                <p className="text-xs text-gray-500">Your earnings (net)</p>
                <p className="text-xl font-semibold mt-1">
                  {formatEuro(stats.totalClientAmount)}
                </p>
                <p className="text-[11px] text-gray-500 mt-1">
                  Platform fee collected: {formatEuro(stats.totalPlatformFee)}
                </p>
              </div>
            </div>
          )}

          {!isStatsLoading && !statsError && !stats && (
            <p className="text-sm text-gray-400">
              No payments recorded yet for this account.
            </p>
          )}
        </section>

        {/* Reviews placeholder */}
        <section className="rounded-2xl border border-gray-800 bg-gray-950/80 p-4 space-y-2">
          <h2 className="text-lg font-semibold">Reviews &amp; rating</h2>
          <p className="text-sm text-gray-400">
            Later we will add a rating system so your customers can leave stars
            and short feedback after a payment.
          </p>
          <p className="text-xs text-gray-500">
            Reviews will appear here in future versions.
          </p>
        </section>
      </div>
    </main>
  );
}

