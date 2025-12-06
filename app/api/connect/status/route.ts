import { NextRequest, NextResponse } from "next/server";
import { getClientById } from "@/lib/clientStore";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      clientId?: string;
    };

    const clientId = body.clientId;

    if (!clientId) {
      return NextResponse.json(
        { error: "clientId is required" },
        { status: 400 }
      );
    }

    const client: any = await getClientById(clientId);

    // Если клиента нет или у него ещё нет привязанного Stripe аккаунта
    if (!client || !client.stripeAccountId) {
      return NextResponse.json(
        {
          connected: false,
        },
        { status: 200 }
      );
    }

    // Если всё ок — возвращаем, что клиент подключён
    return NextResponse.json(
      {
        connected: true,
        stripeAccountId: client.stripeAccountId,
        email: client.email ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error in /api/connect/status:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

