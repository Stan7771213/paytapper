import crypto from "crypto";

const TOKEN_BYTES = 32; // 256-bit
const TOKEN_TTL_MINUTES = 30;

/**
 * Generate a cryptographically secure raw token (base64url).
 * This value is sent to the user via email.
 */
export function generateRawToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

/**
 * Hash a raw token using SHA-256.
 * Only the hash is stored server-side.
 */
export function hashToken(rawToken: string): string {
  if (!rawToken) {
    throw new Error("Token is required");
  }
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Create a reset payload to be stored on Client.
 */
export function createResetPayload() {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(
    Date.now() + TOKEN_TTL_MINUTES * 60 * 1000
  ).toISOString();

  return {
    rawToken, // send via email
    stored: {
      tokenHash,
      expiresAt,
    },
  };
}

/**
 * Validate a stored reset payload against a provided raw token.
 */
export function isResetTokenValid(params: {
  rawToken: string;
  stored?: { tokenHash: string; expiresAt: string };
}): boolean {
  const { rawToken, stored } = params;
  if (!stored) return false;

  const now = Date.now();
  const exp = Date.parse(stored.expiresAt);
  if (Number.isNaN(exp) || exp < now) return false;

  const incomingHash = hashToken(rawToken);
  return crypto.timingSafeEqual(
    Buffer.from(incomingHash),
    Buffer.from(stored.tokenHash)
  );
}
