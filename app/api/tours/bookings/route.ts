import { NextResponse } from "next/server";

import { getAllTourBookings } from "@/lib/tours/bookingStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const bookings = await getAllTourBookings();

    const sorted = [...bookings].sort((a, b) => {
      const aKey = `${a.date} ${a.time} ${a.createdAt}`;
      const bKey = `${b.date} ${b.time} ${b.createdAt}`;
      return aKey < bKey ? 1 : aKey > bKey ? -1 : 0;
    });

    return NextResponse.json({
      count: sorted.length,
      bookings: sorted,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to load tour bookings", details },
      { status: 500 }
    );
  }
}
