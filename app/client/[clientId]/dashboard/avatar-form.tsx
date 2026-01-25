"use client";

import { useRef, useState } from "react";

type UploadOk = { ok: true; avatarUrl: string };
type UploadErr = { error: string };

export function AvatarForm({ initialValue }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue ?? "");
  const [draft, setDraft] = useState(initialValue ?? "");
  const [editing, setEditing] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  async function saveUrl(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const url = draft.trim();

    if (url.length === 0) {
      setError("Avatar URL cannot be empty");
      return;
    }

    if (!url.startsWith("https://")) {
      setError("Avatar URL must start with https://");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/client/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as UploadErr;
        setError(data?.error || "Failed to save avatar");
        return;
      }

      setValue(url);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function uploadFile() {
    setError(null);

    const el = fileRef.current;
    const file = el?.files?.[0];
    if (!file) {
      setError("Choose a file first");
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch("/api/uploads/avatar", {
        method: "POST",
        body: fd,
      });

      const data = (await res.json().catch(() => ({}))) as UploadOk | UploadErr;

      if (!res.ok) {
        const msg = "error" in data && typeof data.error === "string"
          ? data.error
          : "Upload failed";
        setError(msg);
        return;
      }

      if (!("ok" in data) || data.ok !== true || typeof data.avatarUrl !== "string") {
        setError("Upload succeeded, but response was unexpected");
        return;
      }

      // update UI with new avatar
      setValue(data.avatarUrl);
      setDraft(data.avatarUrl);
      setEditing(false);

      // clear file input
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/client/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: "" }), // server treats "" as clear
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as UploadErr;
        setError(data?.error || "Failed to remove avatar");
        return;
      }

      setValue("");
      setDraft("");
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function onCancel() {
    setDraft(value);
    setEditing(false);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <section className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Avatar</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm underline text-gray-400 hover:text-gray-200"
          >
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        value ? (
          <div className="flex items-center gap-4">
            <img
              src={value}
              alt="Avatar preview"
              className="h-16 w-16 rounded-full border border-gray-700 object-cover"
              referrerPolicy="no-referrer"
            />
            <p className="text-xs text-gray-400 break-all">{value}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No avatar set</p>
        )
      ) : (
        <div className="space-y-4">
          {/* Upload */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400">
              Upload an image (PNG/JPG/WEBP, up to 5MB)
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={uploadFile}
              disabled={uploading || saving}
              className="w-full rounded-md bg-black px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : "Upload avatar"}
            </button>
          </div>

          <div className="text-center text-xs text-gray-600">— or —</div>

          {/* URL fallback */}
          <form onSubmit={saveUrl} className="space-y-3">
            <input
              type="url"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm"
            />

            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full rounded-md border border-gray-700 px-3 py-2 text-sm hover:bg-gray-900 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save URL"}
            </button>
          </form>

          {value && (
            <button
              type="button"
              onClick={removeAvatar}
              disabled={saving || uploading}
              className="w-full rounded-md border border-red-700 px-3 py-2 text-sm text-red-300 hover:bg-red-950 disabled:opacity-50"
            >
              {saving ? "Removing…" : "Remove avatar"}
            </button>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="button"
            onClick={onCancel}
            disabled={saving || uploading}
            className="w-full text-sm text-gray-400 hover:text-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      )}
    </section>
  );
}
