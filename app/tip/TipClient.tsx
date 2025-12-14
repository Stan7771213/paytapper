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
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      console.error(err);
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

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950/80 p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">Pay with Paytapper</h1>
        <p className="text-sm text-gray-400 text-center">
          Choose an amount to send a tip or small payment.
        </p>

        <p className="text-xs text-gray-500 text-center">
          Client ID:{' '}
          <span className="font-mono text-gray-300">{effectiveClientId || '—'}</span>
        </p>

        {isClientInvalid && (
          <p className="text-xs text-red-400 text-center">
            Client ID is missing. Please make sure you scanned a valid Paytapper QR code.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          {TIP_PRESETS_EUR.map((amount) => (
            <button
              key={amount}
              type="button"
              disabled={isLoading || isClientInvalid}
              onClick={() => startCheckout(amount)}
              className="py-3 rounded-xl border border-gray-700 bg-gray-900 hover:bg-gray-800 text-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              €{amount}
            </button>
          ))}
        </div>

        <form onSubmit={handleCustomSubmit} className="space-y-2 pt-2">
          <label className="block text-sm text-gray-400">Custom amount</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              step="0.5"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isLoading || isClientInvalid}
            />
            <button
              type="submit"
              disabled={isLoading || isClientInvalid}
              className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Pay'}
            </button>
          </div>
        </form>

        {errorMsg && <p className="text-xs text-red-400 text-center pt-1">{errorMsg}</p>}

        <p className="text-[11px] text-gray-500 text-center pt-2">
          Powered by Paytapper and Stripe. A small platform fee may be applied to each
          transaction.
        </p>
      </div>
    </main>
  );
}
