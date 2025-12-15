import { NextRequest } from "next/server";
import { getPaymentsByClientId } from "@/lib/paymentStore";
import type { Payment } from "@/lib/types";

function csvEscape(value: string): string {
  if (value.includes('"') || value.includes(",") || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatEurFromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}

function getDateIso(p: Payment): string {
  return p.paidAt ?? p.createdAt;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  if (!clientId || !clientId.trim()) {
    return new Response("Missing clientId", { status: 400 });
  }

  const payments = await getPaymentsByClientId(clientId);

  const header = [
    "date",
    "status",
    "grossEur",
    "netEur",
    "paymentIntentId",
  ];

  const rows = payments.map((p) => [
    getDateIso(p),
    p.status,
    formatEurFromCents(p.amountCents),
    formatEurFromCents(p.netAmountCents),
    p.stripe.paymentIntentId,
  ]);

  const csv =
    [header, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n") + "\n";

  const filename = `paytapper-payments-${clientId}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
