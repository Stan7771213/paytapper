import { Suspense } from 'react';
import TipClient from './TipClient';

export default function TipPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <p className="text-sm text-gray-400">Loading payment page…</p>
        </main>
      }
    >
      <TipClient />
    </Suspense>
  );
}

