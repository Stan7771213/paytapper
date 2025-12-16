"use client";

import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

type DownloadQrPngButtonProps = {
  value: string; // absolute URL
  filename: string; // e.g. paytapper-tip-<clientId>.png
  size?: number; // px
};

export function DownloadQrPngButton({
  value,
  filename,
  size = 512,
}: DownloadQrPngButtonProps) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);

  function handleDownload() {
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  }

  return (
    <div className="inline-flex items-center gap-3">
      {/* Hidden high-res canvas used only for PNG export */}
      <div className="sr-only">
        <QRCodeCanvas value={value} size={size} includeMargin ref={setCanvas} />
      </div>

      <button
        type="button"
        className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
        onClick={handleDownload}
      >
        Download QR code (PNG)
      </button>

      <span className="text-xs text-muted-foreground">
        Use this for posters, stickers, or sharing.
      </span>
    </div>
  );
}
