import { NextRequest, NextResponse } from "next/server";
import { listPaymentsByClient } from "@/lib/paymentStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientId = body.clientId as string | undefined;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const payments = listPaymentsByClient(clientId);

    // Фильтруем только валидные (новые) платежи
    const valid = payments.filter((p) => typeof p.amountTotal === "number");

    const totalAmount = valid.reduce((sum, p) => sum + p.amountTotal, 0);
    const totalClientAmount = valid.reduce(
      (sum, p) => sum + (p.clientAmount ?? 0),
      0
    );
    const totalPlatformFee = valid.reduce(
      (sum, p) => sum + (p.platformFeeAmount ?? 0),
      0
    );

    return NextResponse.json({
      clientId,
      count: payments.length,
      totalAmount,
      totalClientAmount,
      totalPlatformFee,
      payments,
    });
  } catch (error) {
    console.error("Error in /api/payments/by-client:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

