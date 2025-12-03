"use client";

import { useMemo, useState } from "react";
import QRCode from "react-qr-code";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.paytapper.net";

export default function AdminPage() {
  const [guideId, setGuideId] = useState<string>("");

  const tipUrl = useMemo(() => {
    const trimmed = guideId.trim();
    if (!trimmed) return "";
    const cleanBase = baseUrl.replace(/\/$/, "");
    return `${cleanBase}/tip?guideId=${encodeURIComponent(trimmed)}`;
  }, [guideId]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl shadow-lg p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-center">
          QR generator for guides
        </h1>

        <p className="text-sm text-gray-600 text-center">
          Enter the guide ID. We will generate a QR code that opens the tip page
          with this guideId in the URL.
        </p>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Guide ID</span>
          <input
            type="text"
            value={guideId}
            onChange={(e) => setGuideId(e.target.value)}
            placeholder="e.g. sveta123"
            className="rounded-xl border px-3 py-2 outline-none"
          />
        </label>

        {tipUrl && (
          <>
            <div className="mt-4 flex flex-col items-center gap-3">
              <p className="text-sm text-gray-700 break-all text-center">
                Tip URL:
                <br />
                <span className="font-mono text-xs">{tipUrl}</span>
              </p>

              <div className="bg-white p-4 rounded-2xl shadow-md">
                <QRCode value={tipUrl} size={180} />
              </div>

              <p className="text-xs text-gray-500 text-center">
                Download or print this QR and give it to the guide. Guests will
                be redirected to the tip page where they choose the amount.
              </p>
            </div>
          </>
        )}

        {!tipUrl && (
          <p className="text-xs text-gray-500 text-center mt-2">
            QR code will appear here after you enter a guide ID.
          </p>
        )}
      </div>
    </main>
  );
}

