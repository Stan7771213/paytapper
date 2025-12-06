'use client';

import { useState, FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';

const TIP_PRESETS_EUR = [5, 10, 20, 50];

type TipClientProps = {
  clientId?: string;
};

export default function TipClient({ clientId }: TipClientProps) {
  const searchParams = useSearchParams();
  const clientIdFromQuery = searchParams.get('clientId');

  const effectiveClientId = clientId || clientIdFromQuery || 'unknown';

  const [customAmount, setCustomAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function startCheckout(amountInEuro: number) {
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const amountInCents = Math.round(amountInEuro * 100);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInCents,
          clientId: effectiveClientId,
          guideId: effectiveClientId, // backward compatibility with old API
        }),
      });

      let data: any = {};

      if (!response.ok) {
        try {
          data = await response.json();
        } catch {
          // ignore
        }
        throw new Error(data.error || 'Failed to create checkout session');
      }

      try {
        data = await response.json();
      } catch {
        throw new Error('Invalid response from server');
      }

      if (!data.url) {
        throw new Error('Missing checkout URL in response');
      }

      window.location.href = data.url;
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCustomSubmit(e: FormEvent) {
    e.preventDefault();
    const value = parseFloat(customAmount.replace(',', '.'));
    if (!isNaN(value) && value > 0) {
      startCheckout(value);
    } else {
      setErrorMsg('Please enter a valid amount');
    }
  }

  const isClientUnknown = effectiveClientId === 'unknown';

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950/80 p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">Pay with Paytapper</h1>
        <p className="text-sm text-gray-400 text-center">
          Choose an amount to send a tip or small payment.
        </p>

        <p className="text-xs text-gray-500 text-center">
          Client ID:{' '}
          <span className="font-mono text-gray-300">{effectiveClientId}</span>
        </p>

        {isClientUnknown && (
          <p className="text-xs text-red-400 text-center">
            Client ID is missing. Please make sure you scanned a valid Paytapper QR code.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          {TIP_PRESETS_EUR.map((amount) => (
            <button
              key={amount}
              type="button"
              disabled={isLoading || isClientUnknown}
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
              disabled={isLoading || isClientUnknown}
            />
            <button
              type="submit"
              disabled={isLoading || isClientUnknown}
              className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Pay'}
            </button>
          </div>
        </form>

        {errorMsg && (
          <p className="text-xs text-red-400 text-center pt-1">{errorMsg}</p>
        )}

        <p className="text-[11px] text-gray-500 text-center pt-2">
          Powered by Paytapper and Stripe. A small platform fee may be applied to
          each transaction.
        </p>
      </div>
    </main>
  );
}

