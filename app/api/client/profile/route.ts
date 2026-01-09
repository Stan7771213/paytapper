import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/sessions";
import { updateClient } from "@/lib/clientStore";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return json({ error: "Unauthorized" }, 401);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const title =
      typeof (body as any).title === "string"
        ? (body as any).title.trim()
        : undefined;

    const description =
      typeof (body as any).description === "string"
        ? (body as any).description.trim()
        : undefined;

    if (title !== undefined && (title.length < 2 || title.length > 50)) {
      return json(
        { error: "Title must be between 2 and 50 characters" },
        400
      );
    }

    if (description !== undefined && description.length > 200) {
      return json(
        { error: "Description must be 200 characters or less" },
        400
      );
    }

    await updateClient(session.clientId, {
      branding:
        title !== undefined || description !== undefined
          ? {
              ...(title !== undefined ? { title } : {}),
              ...(description !== undefined ? { description } : {}),
            }
          : undefined,
    });

    return json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ error: message }, 500);
  }
}

export async function GET() {
  return json({ error: "Method Not Allowed" }, 405);
}
