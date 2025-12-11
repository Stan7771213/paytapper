import { NextRequest, NextResponse } from "next/server";
import { getPaymentsByClient } from "@/lib/paymentStore";

// GET /api/payments/by-client?clientId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { error: "Missing clientId" },
        { status: 400 }
      );
    }

    const payments = await getPaymentsByClient(clientId);

    return NextResponse.json(
      {
        payments,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in GET /api/payments/by-client:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

