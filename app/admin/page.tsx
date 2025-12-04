'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import Link from 'next/link';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export default function AdminPage() {
  const [guideId, setGuideId] = useState('');

  const tipUrl = guideId
    ? `${baseUrl}/tip?guideId=${encodeURIComponent(guideId)}`
    : '';

  const hasGuideId = guideId.trim().length > 0;

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl p-8 shadow-lg">
        <h1 className="text-3xl font-semibold mb-2 text-center">
          Admin – guide QR generator
        </h1>
        <p className="text-zinc-400 text-center mb-8">
          Generate QR codes and links for guides to receive tips.
        </p>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="guideId"
              className="block text-sm font-medium text-zinc-300 mb-2"
            >
              Guide ID
            </label>
            <input
              id="guideId"
              type="text"
              value={guideId}
              onChange={(e) => setGuideId(e.target.value)}
              placeholder="e.g. sveta123"
              className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-zinc-500 mt-1">
              This ID should match the <code>guideId</code> used in Stripe metadata.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex flex-col items-center justify-center border border-zinc-800 rounded-xl p-4 min-h-[220px]">
              {hasGuideId ? (
                <>
                  <QRCode value={tipUrl} size={160} />
                  <p className="mt-3 text-xs text-zinc-400 break-all text-center">
                    {tipUrl}
                  </p>
                </>
              ) : (
                <p className="text-zinc-500 text-sm text-center">
                  Enter a guide ID to generate a QR code for the tip page.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-sm font-semibold mb-1">Tip page URL</h2>
                <p className="text-xs text-zinc-400 break-all bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
                  {hasGuideId ? tipUrl : 'Waiting for guide ID…'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href={hasGuideId ? `/tip?guideId=${encodeURIComponent(guideId)}` : '#'}
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium ${
                    hasGuideId
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                  aria-disabled={!hasGuideId}
                >
                  Open tip page
                </Link>

                <Link
                  href={hasGuideId ? `/guide/${encodeURIComponent(guideId)}` : '#'}
                  className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium ${
                    hasGuideId
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                  }`}
                  aria-disabled={!hasGuideId}
                >
                  Open guide dashboard
                </Link>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-zinc-600 text-center mt-4">
            All links use <code>{baseUrl}</code>. Make sure it matches your deployed domain.
          </p>
        </div>
      </div>
    </div>
  );
}

