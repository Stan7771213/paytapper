'use client';

import { useState, type FormEvent } from 'react';
import type { Client } from '@/lib/types';

const TIP_PRESETS_EUR = [5, 10, 20, 50];

type TipClientProps = {
  clientId: string;
  displayName?: string;
  branding?: Client['branding'];
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

export default function TipClient({ clientId, displayName, branding }: TipClientProps) {
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
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.';
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

  const disabled = isLoading || isClientInvalid;

  const title = branding?.title ?? displayName ?? 'Paytapper';
  const description = branding?.description;
  const avatarUrl = branding?.avatarUrl;

  return (
    <main className="min-h-screen px-4 py-10 text-white bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-800 bg-gray-950/70 backdrop-blur p-6 space-y-5 shadow-sm">
          <div className="space-y-3 text-center">
            <p className="text-xs tracking-wide text-gray-400 uppercase">Paytapper</p>

            {avatarUrl ? (
              <div className="flex items-center justify-center">
                <img
                  src={avatarUrl}
                  alt={`${title} avatar`}
                  className="h-16 w-16 rounded-full border border-gray-800 object-cover"
                />
              </div>
            ) : null}

            <h1 className="text-3xl font-bold">{title}</h1>

            {description ? (
              <p className="text-sm text-gray-400">{description}</p>
            ) : (
              <p className="text-sm text-gray-400">
                Leave a tip or send a small payment via Stripe.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-gray-800 bg-black/30 px-3 py-2">
            <p className="text-[11px] text-gray-500">Client reference</p>
            <p className="font-mono text-xs text-gray-300 break-all">
              {effectiveClientId || '—'}
            </p>
          </div>

          {isClientInvalid && (
            <p className="text-xs text-red-400 text-center">
              Client ID is missing. Please make sure you scanned a valid Paytapper QR code.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            {TIP_PRESETS_EUR.map((amount) => {
              const cents = Math.round(amount * 100);
              return (
                <button
                  key={amount}
                  type="button"
                  disabled={disabled}
                  onClick={() => startCheckout(amount)}
                  className="py-3 rounded-xl border border-gray-700 bg-gray-900 hover:bg-gray-800 text-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label={`Pay EUR ${amount}`}
                >
                  €{formatEur(cents)}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleCustomSubmit} className="space-y-2 pt-1">
            <label className="block text-sm text-gray-400" htmlFor="customAmount">
              Custom amount
            </label>

            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2">
                <span className="text-sm text-gray-400">€</span>
                <input
                  id="customAmount"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 7.50"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                  disabled={disabled}
                  aria-describedby="customAmountHelp"
                />
              </div>

              <button
                type="submit"
                disabled={disabled}
                className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Redirecting…' : 'Continue'}
              </button>
            </div>

            <p id="customAmountHelp" className="text-[11px] text-gray-500">
              You will be redirected to Stripe Checkout to complete payment.
            </p>
          </form>

          <div className="min-h-[18px]">
            {errorMsg && <p className="text-xs text-red-400 text-center">{errorMsg}</p>}
          </div>

          <p className="text-[11px] text-gray-500 text-center">
            Powered by Paytapper and Stripe. A small platform fee may be applied to each transaction.
          </p>
        </div>
      </div>
    </main>
  );
}
