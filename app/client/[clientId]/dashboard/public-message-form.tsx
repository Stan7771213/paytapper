'use client';

import { useState } from 'react';

export function PublicMessageForm({
  initialValue,
}: {
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue ?? '');
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    await fetch('/api/client/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: value }),
    });

    setSaving(false);
  }

  return (
    <section className="border rounded-lg p-4 space-y-3">
      <h2 className="font-semibold">Public message</h2>

      <form onSubmit={onSubmit} className="space-y-3">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={200}
          placeholder="Message shown to people who tip you"
          className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-sm"
          rows={3}
        />

        <button
          disabled={saving}
          className="rounded-md border border-gray-700 px-3 py-2 text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save message'}
        </button>
      </form>
    </section>
  );
}
