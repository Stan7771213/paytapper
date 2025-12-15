"use client";

import { useEffect, useRef, useState } from "react";

type CopyTipLinkButtonProps = {
  text: string;
};

export function CopyTipLinkButton({ text }: CopyTipLinkButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  async function handleCopy() {
    try {
      setStatus("idle");

      if (!text || !text.trim()) {
        throw new Error("Nothing to copy.");
      }

      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
        throw new Error("Clipboard API is not available in this browser context.");
      }

      await navigator.clipboard.writeText(text);

      setStatus("copied");
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setStatus("idle"), 1500);
    } catch (err) {
      console.error(err);
      setStatus("error");
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setStatus("idle"), 2000);
    }
  }

  const label =
    status === "copied" ? "Copied!" : status === "error" ? "Copy failed" : "Copy link";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50"
      aria-live="polite"
    >
      {label}
    </button>
  );
}
