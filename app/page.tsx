import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Paytapper
      </h1>

      <p className="mt-6 text-lg text-gray-600">
        Simple QR-based tipping and small payments for guides, drivers and creators.
      </p>

      <div className="mt-10 flex flex-col items-center gap-4">
        <Link
          href="/tip/demo"
          className="rounded-md bg-black px-6 py-3 text-white hover:bg-gray-800"
        >
          Open demo tip page
        </Link>

        <p className="text-sm text-gray-500">
          Client accounts and authentication are coming in v1.1
        </p>
      </div>
    </main>
  );
}
