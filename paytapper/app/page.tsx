export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="max-w-xl px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          PayTapper
        </h1>

        <p className="text-lg md:text-xl mb-6 text-slate-300">
          Fast and effortless tipping for guides & service professionals.
        </p>

        <p className="text-sm text-slate-400 mb-8">
          Scan a QR code → Apple Pay / Google Pay → instant payout.
          <br />
          We are preparing the full platform with guide accounts,
          Stripe onboarding and personalized QR codes.
        </p>

        <button className="px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-base font-semibold transition">
          Join as an early guide
        </button>
      </div>
    </main>
  );
}
