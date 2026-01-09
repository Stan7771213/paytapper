'use client';

import { useState } from 'react';

export function DisplayNameForm({
  initialValue,
  fallbackValue,
}: {
  initialValue?: string;
  fallbackValue: string;
}) {
  const [draft, setDraft] = useState(initialValue ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch('/api/client/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: draft }),
    });

    // Hard reload to re-fetch SSR data correctly
    window.location.reload();
  }

  const display = initialValue || fallbackValue;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <strong>Name:</strong>
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
        <p className="text-sm text-gray-200">{display}</p>
      ) : (
        <form onSubmit={onSave} className="space-y-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={50}
            placeholder="Public display name"
            className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm"
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md border border-gray-700 px-3 py-1 text-sm hover:bg-gray-900 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
