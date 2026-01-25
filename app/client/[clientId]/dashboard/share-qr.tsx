"use client";

import { useMemo, useState } from "react";

export function ShareQrTools({ tipUrl }: { tipUrl: string }) {
  const [message, setMessage] = useState("");

  const shareText = useMemo(() => {
    const msg = message.trim();
    if (!msg) return `My Paytapper link: ${tipUrl}`;
    return `${msg}\n\n${tipUrl}`;
  }, [message, tipUrl]);

  const whatsappUrl = useMemo(() => {
    // Works for WhatsApp Web + mobile app
    return `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  }, [shareText]);

  const qrPngUrl = useMemo(() => {
    return `/api/qr?value=${encodeURIComponent(tipUrl)}`;
  }, [tipUrl]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(tipUrl);
      alert("Link copied");
    } catch {
      // fallback
      const ok = window.prompt("Copy this link:", tipUrl);
      void ok;
    }
  }

  async function copyMessageAndLink() {
    try {
      await navigator.clipboard.writeText(shareText);
      alert("Message + link copied");
    } catch {
      const ok = window.prompt("Copy message + link:", shareText);
      void ok;
    }
  }

  async function shareNative() {
    // Web Share API — user chooses WhatsApp/Telegram/SMS if available
    const nav = navigator as any;
    if (!nav.share) {
      alert("Share is not supported in this browser");
      return;
    }
    try {
      await nav.share({ text: shareText });
    } catch {
      // user cancelled or failed — ignore
    }
  }

  async function downloadQr() {
    const r = await fetch(qrPngUrl, { cache: "no-store" });
    if (!r.ok) {
      alert("Failed to download QR");
      return;
    }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "paytapper-qr.png";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  const canNativeShare = typeof window !== "undefined" && typeof (navigator as any).share === "function";

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-gray-800 bg-black/30 p-3">
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Message (optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a short note for your guests..."
          className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm"
          rows={3}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="rounded-md border border-gray-700 px-3 py-2 text-xs hover:bg-gray-900"
        >
          Copy link
        </button>

        <button
          type="button"
          onClick={copyMessageAndLink}
          className="rounded-md border border-gray-700 px-3 py-2 text-xs hover:bg-gray-900"
        >
          Copy message + link
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-gray-700 px-3 py-2 text-xs hover:bg-gray-900"
        >
          Send to WhatsApp
        </a>

        {canNativeShare && (
          <button
            type="button"
            onClick={shareNative}
            className="rounded-md border border-gray-700 px-3 py-2 text-xs hover:bg-gray-900"
          >
            Share…
          </button>
        )}

        <button
          type="button"
          onClick={downloadQr}
          className="rounded-md border border-gray-700 px-3 py-2 text-xs hover:bg-gray-900"
        >
          Download QR (PNG)
        </button>
      </div>
    </div>
  );
}
