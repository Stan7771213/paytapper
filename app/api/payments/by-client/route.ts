import { NextRequest, NextResponse } from "next/server";
import { getPaymentsByClientId } from "@/lib/paymentStore";

export async function POST(req: NextRequest) {
  try {
    const { clientId } = await req.json();

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const payments = await getPaymentsByClientId(clientId);

    const totalTips = payments.length;

    const totalAmountGross = payments.reduce(
      (sum, p) => sum + (p.amountTotal || 0),
      0
    );

    const totalNetToClient = payments.reduce(
      (sum, p) => sum + (p.clientAmount || 0),
      0
    );

    const totalPlatformFee = payments.reduce(
      (sum, p) => sum + (p.platformFeeAmount || 0),
      0
    );

    const summary = {
      totalTips,
      totalAmountGross,
      totalNetToClient,
      totalPlatformFee,
    };

    return NextResponse.json(
      {
        payments,

        // Новые/говорящие поля
        summary,
        stats: summary,

        // ИМЕННО эти поля ожидает dashboard/page.tsx:
        clientId,
        count: totalTips,
        totalAmount: totalAmountGross,
        totalClientAmount: totalNetToClient,
        totalPlatformFee: totalPlatformFee,

        // Дополнительно – альтернативные имена, вдруг пригодятся дальше
        totalTips,
        totalAmountGross,
        totalNetAmount: totalNetToClient,
        totalNetToClient,
        platformFeeTotal: totalPlatformFee,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in by-client route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

