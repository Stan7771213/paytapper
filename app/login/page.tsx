"use client";

export default function LoginPage() {
  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Log in</h1>

      <p className="text-sm text-gray-700">
        Login is not available in version 1 of Paytapper.
      </p>

      <p className="text-sm text-gray-700">
        The current version focuses on payments, tipping, and Stripe Connect
        onboarding. Authentication will be introduced in a future version.
      </p>

      <button
        className="w-full rounded-md border border-gray-700 px-3 py-2 text-sm font-medium opacity-50 cursor-not-allowed"
        disabled
      >
        Login disabled
      </button>

      <p className="text-sm text-gray-600">
        New here?{" "}
        <span className="underline opacity-50 cursor-not-allowed">
          Registration is currently disabled
        </span>
      </p>
    </main>
  );
}
