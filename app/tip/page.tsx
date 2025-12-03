import { Suspense } from "react";
import TipClient from "./TipClient";

export default function TipPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center p-4">
          <p className="text-sm text-gray-500">Loading tip page…</p>
        </main>
      }
    >
      <TipClient />
    </Suspense>
  );
}

