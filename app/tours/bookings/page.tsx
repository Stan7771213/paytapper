export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getAllTourBookings } from "@/lib/tours/bookingStore";

function formatEur(cents: number): string {
  return (cents / 100).toFixed(2);
}

export default async function TourBookingsPage() {
  const bookings = await getAllTourBookings();

  const sorted = [...bookings].sort((a, b) => {
    const aKey = `${a.date} ${a.time} ${a.createdAt}`;
    const bKey = `${b.date} ${b.time} ${b.createdAt}`;
    return aKey < bKey ? 1 : aKey > bKey ? -1 : 0;
  });

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tour bookings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Total bookings: {sorted.length}
          </p>
        </div>

        <a
          href="/tours/tallinn-old-town"
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Open booking page
        </a>
      </div>

      {sorted.length === 0 ? (
        <section className="border rounded-lg p-4">
          <p className="text-sm text-gray-500">No tour bookings yet.</p>
        </section>
      ) : (
        <div className="space-y-4">
          {sorted.map((booking) => (
            <section key={booking.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="font-semibold text-lg">{booking.productTitle}</h2>
                  <p className="text-sm text-gray-500">
                    {booking.date} at {booking.time}
                  </p>
                </div>

                <div className="text-sm md:text-right">
                  <p>
                    <strong>Status:</strong> {booking.status}
                  </p>
                  <p>
                    <strong>Paid:</strong> {formatEur(booking.amountCents)} €
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="border rounded-lg p-3 space-y-1">
                  <h3 className="font-medium">Customer</h3>
                  <p className="text-sm">
                    <strong>Name:</strong> {booking.customer.name}
                  </p>
                  <p className="text-sm break-all">
                    <strong>Email:</strong> {booking.customer.email}
                  </p>
                  <p className="text-sm">
                    <strong>Phone:</strong> {booking.customer.phone}
                  </p>
                </div>

                <div className="border rounded-lg p-3 space-y-1">
                  <h3 className="font-medium">Participants</h3>
                  <p className="text-sm">
                    <strong>Adults:</strong> {booking.adults}
                  </p>
                  <p className="text-sm">
                    <strong>Children:</strong> {booking.children}
                  </p>
                  <p className="text-sm">
                    <strong>Free children:</strong> {booking.freeChildren}
                  </p>
                  <p className="text-sm">
                    <strong>Extra paid children:</strong> {booking.extraPaidChildren}
                  </p>
                  <p className="text-sm">
                    <strong>Total guests:</strong> {booking.totalGuests}
                  </p>
                  <p className="text-sm">
                    <strong>Payable guests:</strong> {booking.payableGuests}
                  </p>
                </div>

                <div className="border rounded-lg p-3 space-y-1">
                  <h3 className="font-medium">Stripe & delivery</h3>
                  <p className="text-sm break-all">
                    <strong>PaymentIntent:</strong> {booking.stripe.paymentIntentId}
                  </p>
                  <p className="text-sm break-all">
                    <strong>Checkout Session:</strong> {booking.stripe.checkoutSessionId}
                  </p>
                  <p className="text-sm">
                    <strong>Created:</strong> {booking.createdAt}
                  </p>
                  <p className="text-sm">
                    <strong>Paid:</strong> {booking.paidAt}
                  </p>
                  <p className="text-sm">
                    <strong>Emails sent:</strong>{" "}
                    {booking.confirmationEmailsSentAt ?? "not recorded"}
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
