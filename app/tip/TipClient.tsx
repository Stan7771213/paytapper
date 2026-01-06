'use client';

import { useState, type FormEvent } from 'react';

const TIP_PRESETS_EUR = [5, 10, 20, 50];

type TipClientProps = {
  clientId: string;
};

type CheckoutResponse =
  | { url: string; checkoutSessionId: string }
  | { error: string; details?: string };

function isCheckoutSuccess(
  data: CheckoutResponse
): data is { url: string; checkoutSessionId: string } {
  return typeof (data as { url?: unknown }).url === 'string';
}

function formatEur(amountCents: number): string {
  return (amountCents / 100).toFixed(2);
}

export default function TipClient({ clientId }: TipClientProps) {
  const effectiveClientId = clientId.trim();

  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isClientInvalid = effectiveClientId.length === 0;

  async function startCheckout(amountInEuro: number) {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      if (isClientInvalid) {
        throw new Error('Client ID is missing.');
      }

      const amountCents = Math.round(amountInEuro * 100);

      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents,
          clientId: effectiveClientId,
        }),
      });

      const data = (await response.json()) as CheckoutResponse;

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('This creator is not ready to accept payments yet.');
        }

        const msg =
          'error' in data && typeof data.error === 'string'
            ? data.error
            : 'Failed to create checkout session';
        throw new Error(msg);
      }

      if (!isCheckoutSuccess(data)) {
        throw new Error('Invalid response from server');
      }

      window.location.href = data.url;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.';
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleCustomSubmit(e: FormEvent) {
    e.preventDefault();
    const value = parseFloat(customAmount.replace(',', '.'));
    if (!Number.isNaN(value) && value > 0) {
      startCheckout(value);
    } else {
      setErrorMsg('Please enter a valid amount');
    }
  }

  const disabled = isLoading || isClientInvalid;

  return (
    <section className="max-w-xl mx-auto px-4 py-10">
      <div className="rounded-2xl border border-gray-800 bg-gray-950/70 backdrop-blur p-6 space-y-5">
        <div className="grid grid-cols-2 gap-3">
          {TIP_PRESETS_EUR.map((amount) => {
            const cents = Math.round(amount * 100);
            return (
              <button
                key={amount}
                type="button"
                disabled={disabled}
                onClick={() => startCheckout(amount)}
                className="py-3 rounded-xl border border-gray-700 bg-gray-900 hover:bg-gray-800 text-lg font-semibold disabled:opacity-40"
              >
                €{formatEur(cents)}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleCustomSubmit} className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2">
              <span className="text-sm text-gray-400">€</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 7.50"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none"
                disabled={disabled}
              />
            </div>

            <button
              type="submit"
              disabled={disabled}
              className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-40"
            >
              {isLoading ? 'Redirecting…' : 'Continue'}
            </button>
          </div>
        </form>

        {errorMsg && (
          <p className="text-xs text-red-400 text-center">{errorMsg}</p>
        )}
      </div>
    </section>
  );
}
