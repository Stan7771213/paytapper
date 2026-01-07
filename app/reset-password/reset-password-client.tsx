'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ResetPasswordClient() {
  const params = useSearchParams();
  const token = params.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  async function requestReset(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Sending reset email…');

    const res = await fetch('/api/auth/reset/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setStatus(res.ok ? 'If this email exists, a reset link was sent.' : 'Error');
  }

  async function confirmReset(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Resetting password…');

    const res = await fetch('/api/auth/reset/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password }),
    });

    setStatus(res.ok ? 'Password updated. You can now log in.' : 'Invalid or expired token');
  }

  return (
    <main className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Reset password</h1>

      {!token ? (
        <form onSubmit={requestReset} className="space-y-3">
          <input
            className="w-full border rounded px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="w-full border rounded px-3 py-2">Send reset link</button>
        </form>
      ) : (
        <form onSubmit={confirmReset} className="space-y-3">
          <input
            className="w-full border rounded px-3 py-2"
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="w-full border rounded px-3 py-2">Set new password</button>
        </form>
      )}

      {status && <p className="text-sm text-gray-600">{status}</p>}
    </main>
  );
}
