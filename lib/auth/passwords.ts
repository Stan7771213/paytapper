import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/**
 * Hash a plaintext password using bcrypt.
 * Never store or log the plaintext password.
 */
export async function hashPassword(plain: string): Promise<string> {
  if (!plain || plain.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Verify a plaintext password against a stored bcrypt hash.
 * Returns false on any mismatch.
 */
export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}
