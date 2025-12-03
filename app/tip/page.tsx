"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

const TIP_PRESETS_EUR = [5, 10, 20, 50];

export default function TipPage() {
  const searchParams = useSearchParams();
  const guideIdFromQuery = searchParams.get("guideId");
  const guideId = guideIdFromQuery || "unknown";

  const [customAmount, setCustomAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function startCheckout(amountInEuro: number) {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const amountInCents = Math.round(amountInEuro * 100);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInCents,
          guideId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to create checkout session");
      }

      const data = await response.json();

      if (!data?.url) {
        throw new Error("Missing checkout URL in response");
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(customAmount.replace(",", "."));
    if (!isNaN(value) && value > 0) {
      startCheckout(value);
    } else {
      setErrorMsg("Please enter a valid amount");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl shadow-lg p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">
          Leave a tip for your guide
        </h1>

        <p className="text-center text-sm text-gray-600">
          Guide ID: <span className="font-mono">{guideId}</span>
        </p>

        <div className="grid grid-cols-2 gap-3 mt-2">
          {TIP_PRESETS_EUR.map((amount) => (
            <button
              key={amount}
              disabled={isLoading}
              onClick={() => startCheckout(amount)}
              className="py-3 rounded-xl border text-lg font-semibold hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60"
            >
              {amount} €
            </button>
          ))}
        </div>

        <form onSubmit={handleCustomSubmit} className="mt-4 flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Custom amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            className="flex-1 rounded-xl border px-3 py-2 outline-none"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border font-semibold hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60"
          >
            OK
          </button>
        </form>

        {isLoading && (
          <p className="text-center text-sm text-gray-500">
            Redirecting to Stripe…
          </p>
        )}

        {errorMsg && (
          <p className="text-center text-sm text-red-600">{errorMsg}</p>
        )}
      </div>
    </main>
  );
}

