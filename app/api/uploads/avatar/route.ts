import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";

import { getSession } from "@/lib/auth/sessions";
import { updateClient } from "@/lib/clientStore";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error("Missing required environment variable: " + name);
  return v.trim();
}

function extFromMime(mime: string): string | null {
  const m = mime.toLowerCase().trim();
  if (m === "image/png") return "png";
  if (m === "image/jpeg") return "jpg";
  if (m === "image/webp") return "webp";
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.clientId) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Uploads must use Vercel Blob (no local fallback)
    requireEnv("BLOB_READ_WRITE_TOKEN");

    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return json({ error: "Missing file" }, 400);
    }

    const maxBytes = 5_000_000; // 5MB
    if (file.size <= 0) {
      return json({ error: "Empty file" }, 400);
    }
    if (file.size > maxBytes) {
      return json({ error: "File is too large (max 5MB)" }, 400);
    }

    const ext = extFromMime(file.type);
    if (!ext) {
      return json(
        { error: "Unsupported file type. Use PNG, JPG, or WEBP." },
        400
      );
    }

    const key = `avatars/${session.clientId}/${randomUUID()}.${ext}`;
    const buf = Buffer.from(await file.arrayBuffer());

    const res = await put(key, buf, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });

    const avatarUrl = res.url;

    await updateClient(session.clientId, {
      branding: { avatarUrl },
    });

    return json({ ok: true, avatarUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ error: message }, 500);
  }
}

export async function GET() {
  return json({ error: "Method Not Allowed" }, 405);
}
