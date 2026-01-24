import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

type Entry = {
  count: number;
  resetAt: number;
};

const LIMIT = 3;
const WINDOW_MS = 60 * 60 * 1000;
const memoryStore = new Map<string, Entry>();

function getIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key || !key.trim()) return null;
  return new Resend(key.trim());
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const now = Date.now();

  const entry = memoryStore.get(ip);
  if (entry && now < entry.resetAt) {
    if (entry.count >= LIMIT) {
      return json({ error: "Too many requests" }, 429);
    }
    entry.count += 1;
  } else {
    memoryStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim() : "";

  if (!message) {
    return json({ error: "Message is required" }, 400);
  }

  console.log("[feedback]", { email, message, ip });

  const resend = getResend();
  if (resend) {
    try {
      await resend.emails.send({
        from: "Paytapper <no-reply@paytapper.net>",
        to: "stan.master4@gmail.com",
        subject: "New feedback — Paytapper",
        html: `
          <div style="font-family: system-ui, sans-serif; line-height: 1.5;">
            <h2>New feedback</h2>
            <p><strong>Email:</strong> ${email || "not provided"}</p>
            <p><strong>IP:</strong> ${ip}</p>
            <p><strong>Message:</strong></p>
            <pre>${message}</pre>
          </div>
        `,
      });
    } catch (err) {
      console.error("[feedback email error]", err);
    }
  }

  return json({ ok: true });
}
