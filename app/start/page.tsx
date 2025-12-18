import { Suspense } from "react";
import { redirect } from "next/navigation";

export default function StartPage() {
  return (
    <main className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Get your tipping QR</h1>

      <p className="text-sm text-gray-600">
        Create your Paytapper account, connect Stripe, and receive tips directly
        to your bank account.
      </p>

      <Suspense>
        <StartForm />
      </Suspense>
    </main>
  );
}

function StartForm() {
  return (
    <form action={startAction} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Your name</label>
        <input
          name="displayName"
          required
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded bg-black px-4 py-2 text-white"
      >
        Get my QR
      </button>
    </form>
  );
}

// --- Server Action (MUST return void / Promise<void>) ---
async function startAction(formData: FormData): Promise<void> {
  "use server";

  const displayName = String(formData.get("displayName") || "").trim();
  const email = String(formData.get("email") || "").trim();

  if (!displayName) {
    throw new Error("Name is required");
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/clients`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        email: email || undefined,
        payoutMode: "direct",
      }),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to create client");
  }

  const data = (await res.json()) as { dashboardUrl: string };

  // redirect() throws and never returns (correct for Server Actions)
  redirect(data.dashboardUrl);
}
