'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import Link from 'next/link';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export default function AdminPage() {
  const [clientId, setClientId] = useState('');
  const hasClientId = clientId.trim().length > 0;

  const paymentUrl = hasClientId
    ? `${baseUrl}/tip?clientId=${encodeURIComponent(clientId.trim())}`
    : '';

  const handleCopy = async () => {
    if (!paymentUrl) return;
    try {
      await navigator.clipboard.writeText(paymentUrl);
      alert('Payment link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy link', error);
      alert('Could not copy the link. Please copy it manually.');
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-3xl border border-gray-800 rounded-2xl p-8 bg-gray-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Client QR generator</h1>
            <p className="text-gray-400 text-sm mt-1">
              Create payment links and QR codes for your clients to receive tips and small payments.
            </p>
          </div>
          <Link
            href="/"
            className="text-xs text-gray-400 hover:text-gray-200 underline"
          >
            ← Back to landing
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left side: client ID input */}
          <div>
            <label className="block text-sm mb-1" htmlFor="clientId">
              Client ID
            </label>
            <input
              id="clientId"
              type="text"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              placeholder="For example: cafe-001, tour-operator-123"
              className="w-full rounded-lg bg-black border border-gray-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <p className="text-xs text-gray-500 mt-2">
              This ID should match the identifier you use for this client in your internal system.
            </p>

            <div className="mt-6">
              <h2 className="text-sm font-semibold mb-2">Payment page URL</h2>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  readOnly
                  value={paymentUrl || 'Enter a client ID to generate a payment link'}
                  className="w-full rounded-lg bg-black border border-gray-700 px-3 py-2 text-xs text-gray-300"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!hasClientId}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
                      hasClientId
                        ? 'bg-white text-black hover:bg-gray-200'
                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Copy link
                  </button>
                  {hasClientId && (
                    <a
                      href={paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 rounded-lg py-2 text-xs font-semibold text-center bg-gray-900 border border-gray-600 hover:bg-gray-800 transition"
                    >
                      Open page
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right side: QR code preview */}
          <div className="flex flex-col items-center justify-center border border-gray-800 rounded-2xl px-6 py-8 min-h-[260px]">
            {hasClientId ? (
              <>
                <div className="bg-white p-4 rounded-xl">
                  <QRCode value={paymentUrl} size={160} />
                </div>
                <p className="text-xs text-gray-400 mt-4 text-center max-w-xs">
                  This QR code points to the client&apos;s payment page. You can print it or place it on tables,
                  doors, or tour materials.
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500 text-center">
                Enter a <span className="font-semibold">Client ID</span> on the left to generate
                a payment link and QR code for this client.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

