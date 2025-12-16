import fs from "node:fs/promises";
import path from "node:path";
import { list, put } from "@vercel/blob";

function isVercelRuntime(): boolean {
  return Boolean(process.env.VERCEL);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error("Missing required environment variable: " + name);
  }
  return value.trim();
}

function normalizePathname(relativePath: string): string {
  const p = relativePath.trim().replace(/^\/+/, "");
  if (!p) throw new Error("Invalid storage path");
  return p;
}

export async function readJsonArray<T>(relativePath: string): Promise<T[]> {
  const pathname = normalizePathname(relativePath);

  if (!isVercelRuntime()) {
    const abs = path.join(process.cwd(), pathname);
    try {
      const raw = await fs.readFile(abs, "utf8");
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error(pathname + " must be a JSON array");
      }
      return parsed as T[];
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      if (code === "ENOENT") return [];
      throw e;
    }
  }

  requireEnv("BLOB_READ_WRITE_TOKEN");

  const res = await list({ prefix: pathname, limit: 100 });
  const exact = res.blobs.find((b) => b.pathname === pathname);

  if (!exact?.url) return [];

  const r = await fetch(exact.url);
  if (!r.ok) {
    throw new Error("Failed to fetch blob: " + pathname + " status=" + r.status);
  }

  const parsed: unknown = await r.json();
  if (!Array.isArray(parsed)) {
    throw new Error(pathname + " must be a JSON array");
  }
  return parsed as T[];
}

export async function writeJsonArray(relativePath: string, data: unknown[]): Promise<void> {
  const pathname = normalizePathname(relativePath);

  if (!Array.isArray(data)) {
    throw new Error(pathname + " must be a JSON array");
  }

  const content = JSON.stringify(data, null, 2) + "\n";

  if (!isVercelRuntime()) {
    const abs = path.join(process.cwd(), pathname);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, content, "utf8");
    return;
  }

  requireEnv("BLOB_READ_WRITE_TOKEN");

  await put(pathname, content, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}
