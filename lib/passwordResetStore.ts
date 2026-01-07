import { randomUUID, createHash } from "node:crypto";
import { readJsonArray, writeJsonArray } from "@/lib/jsonStorage";

const RESET_TOKENS_PATH = "password_reset_tokens.json";

export type PasswordResetTokenRecord = {
  userId: string;
  tokenHash: string;
  expiresAt: string;
  usedAt?: string;
};

/**
 * Create a new password reset token.
 * Returns RAW token (to be emailed).
 *
 * Invariants:
 * - Only tokenHash is persisted
 * - Token has TTL
 */
export async function createPasswordResetToken(input: {
  userId: string;
  ttlSeconds: number;
}): Promise<{ rawToken: string }> {
  const rawToken = randomUUID() + randomUUID();
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date(
    Date.now() + input.ttlSeconds * 1000
  ).toISOString();

  const tokens = await readJsonArray<PasswordResetTokenRecord>(
    RESET_TOKENS_PATH
  );

  tokens.push({
    userId: input.userId,
    tokenHash,
    expiresAt,
  });

  await writeJsonArray(RESET_TOKENS_PATH, tokens);

  return { rawToken };
}

/**
 * Consume password reset token.
 * - must exist
 * - must not be expired
 * - must not be used
 */
export async function consumePasswordResetToken(input: {
  rawToken: string;
}): Promise<{ userId: string }> {
  const tokenHash = hashToken(input.rawToken);

  const tokens = await readJsonArray<PasswordResetTokenRecord>(
    RESET_TOKENS_PATH
  );

  const idx = tokens.findIndex((t) => t.tokenHash === tokenHash);
  if (idx === -1) {
    throw new Error("Invalid or expired token");
  }

  const record = tokens[idx];

  if (record.usedAt) {
    throw new Error("Token already used");
  }

  if (new Date(record.expiresAt).getTime() <= Date.now()) {
    throw new Error("Token expired");
  }

  tokens[idx] = {
    ...record,
    usedAt: new Date().toISOString(),
  };

  await writeJsonArray(RESET_TOKENS_PATH, tokens);

  return { userId: record.userId };
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
