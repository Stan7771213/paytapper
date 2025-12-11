import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/clientStore";
import { sendClientWelcomeEmail } from "@/lib/email";

const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.paytapper.net";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const name =
      typeof body.name === "string" && body.name.trim().length > 0
        ? body.name.trim()
        : undefined;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Create or reuse existing client
    const client = await createClient({ email, name });

    const tipUrl = `${baseUrl}/tip?clientId=${encodeURIComponent(client.id)}`;

    // Call email placeholder (does NOT send a real email yet)
    let emailPlaceholderExecuted = false;

    try {
      const result = await sendClientWelcomeEmail({
        email: client.email,
        tipUrl,
        clientId: client.id,
      });

      if (result && result.success) {
        emailPlaceholderExecuted = true;
      }
    } catch (emailError) {
      console.error(
        "🔴 Failed to execute sendClientWelcomeEmail placeholder:",
        emailError
      );
      // We do NOT fail the request if email placeholder crashes
    }

    return NextResponse.json(
      {
        client,
        tipUrl,
        emailPlaceholderExecuted,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("🔴 Error in POST /api/clients/create:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

