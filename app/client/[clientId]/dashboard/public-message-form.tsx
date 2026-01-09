'use client';

import { useState } from 'react';

export function PublicMessageForm({
  initialValue,
}: {
  initialValue?: string;
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
      body: JSON.stringify({ description: draft }),
    });

    // Hard reload to sync SSR consumers (tip page)
    window.location.reload();
  }

  return (
    <section className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Public message</h2>
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
        <p className="text-sm text-gray-200 whitespace-pre-wrap">
          {initialValue || <span className="text-gray-500">No public message</span>}
        </p>
      ) : (
        <form onSubmit={onSave} className="space-y-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={200}
            placeholder="Message shown to people who tip you"
            className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm"
            rows={3}
          />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md border border-gray-700 px-3 py-2 text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
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
    </section>
  );
}
