import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/session";
import { getClientById, updateClient } from "@/lib/clientStore";

export const runtime = "nodejs";

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    // 1) Auth
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) Ownership
    const client = await getClientById(session.clientId);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (client.ownerUserId !== session.userAuthId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3) Parse multipart form
    const formData = await req.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing avatar file" },
        { status: 400 }
      );
    }

    // 4) Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 415 }
      );
    }

    // 5) Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File is too large (max 2MB)" },
        { status: 413 }
      );
    }

    // 6) Upload to Vercel Blob (deterministic path)
    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
        ? "webp"
        : "jpg";

    const blobPath = `avatars/${client.id}.${extension}`;

    const blob = await put(blobPath, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });

    // 7) Persist avatar URL
    await updateClient(client.id, {
      branding: {
        ...(client.branding ?? {}),
        avatarUrl: blob.url,
      },
    });

    return NextResponse.json({
      success: true,
      avatarUrl: blob.url,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
