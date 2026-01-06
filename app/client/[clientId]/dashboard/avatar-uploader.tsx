"use client";

import { useState } from "react";

export function AvatarUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/clients/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Upload failed");
      }

      // Correct for SSR MVP: reload server data
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Avatar / portrait
      </label>

      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        disabled={isUploading}
        onChange={handleFileChange}
      />

      {isUploading && (
        <p className="text-sm text-gray-500">Uploading…</p>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
