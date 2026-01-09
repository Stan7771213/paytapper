'use client';

import { useState } from 'react';

export function AvatarForm({
  initialValue,
}: {
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue ?? '');
  const [draft, setDraft] = useState(initialValue ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const url = draft.trim();

    if (url.length === 0) {
      setError('Avatar URL cannot be empty');
      return;
    }

    if (!url.startsWith('https://')) {
      setError('Avatar URL must start with https://');
      return;
    }

    setSaving(true);

    const res = await fetch('/api/client/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatarUrl: url }),
    });

    if (!res.ok) {
      setError('Failed to save avatar');
      setSaving(false);
      return;
    }

    setValue(url);
    setEditing(false);
    setSaving(false);
  }

  function onCancel() {
    setDraft(value);
    setEditing(false);
    setError(null);
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
        <form onSubmit={onSave} className="space-y-3">
          <input
            type="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://example.com/avatar.jpg"
            className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm"
          />

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md border border-gray-700 px-3 py-2 text-sm hover:bg-gray-900 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={saving}
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
