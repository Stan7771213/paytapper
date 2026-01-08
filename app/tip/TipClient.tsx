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
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

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

      setCheckoutUrl(data.url);
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

  const safeAvatarUrl =
    typeof avatarUrl === 'string' && avatarUrl.startsWith('https://')
      ? avatarUrl
      : null;

  return (
    <main className="min-h-screen px-4 py-10 text-white bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-800 bg-gray-950/70 backdrop-blur p-6 space-y-5 shadow-sm">
          <div className="space-y-3 text-center">
            <p className="text-xs tracking-wide text-gray-400 uppercase">Paytapper</p>

            {safeAvatarUrl && (
              <div className="flex items-center justify-center">
                <img
                  src={safeAvatarUrl}
                  alt={`${title} avatar`}
                  className="h-16 w-16 rounded-full border border-gray-800 object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <h1 className="text-3xl font-bold">{title}</h1>

            {description ? (
              <p className="text-sm text-gray-400">{description}</p>
            ) : (
              <p className="text-sm text-gray-400">
                Leave a tip or send a small payment via Stripe.
              </p>
            )}
          </div>

          {checkoutUrl ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-gray-300">
                To complete the payment, please continue to Stripe Checkout.
              </p>

              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-black text-sm font-semibold"
              >
                Continue to payment
              </a>

              <p className="text-[11px] text-gray-500">
                Stripe Checkout will open in your browser.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 pt-1">
                {TIP_PRESETS_EUR.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    disabled={disabled}
                    onClick={() => startCheckout(amount)}
                    className="py-3 rounded-xl border border-gray-700 bg-gray-900 hover:bg-gray-800 text-lg font-semibold disabled:opacity-40"
                  >
                    €{formatEur(Math.round(amount * 100))}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCustomSubmit} className="space-y-2 pt-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="Custom amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-sm"
                    disabled={disabled}
                  />
                  <button
                    type="submit"
                    disabled={disabled}
                    className="px-4 py-2 rounded-xl bg-white text-black text-sm font-semibold disabled:opacity-40"
                  >
                    Continue
                  </button>
                </div>
              </form>
            </>
          )}

          {errorMsg && (
            <p className="text-xs text-red-400 text-center">{errorMsg}</p>
          )}

          <p className="text-[11px] text-gray-500 text-center">
            Powered by Paytapper and Stripe.
          </p>
        </div>
      </div>
    </main>
  );
}
