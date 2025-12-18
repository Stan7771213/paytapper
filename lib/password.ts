import { randomBytes, pbkdf2 } from "crypto";

const ITERATIONS = 100_000;
const KEY_LENGTH = 32;
const DIGEST = "sha256";

/**
 * Hashes a password using PBKDF2.
 *
 * Format:
 * pbkdf2$<iterations>$<salt>$<hash>
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password) {
    throw new Error("Password must not be empty");
  }

  const salt = randomBytes(16).toString("hex");

  const hash = await pbkdf2Async(
    password,
    salt,
    ITERATIONS,
    KEY_LENGTH,
    DIGEST
  );

  return `pbkdf2$${ITERATIONS}$${salt}$${hash.toString("hex")}`;
}

/**
 * Verifies a password against a stored PBKDF2 hash.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  if (!password || !storedHash) {
    return false;
  }

  const parts = storedHash.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") {
    return false;
  }

  const iterations = Number(parts[1]);
  const salt = parts[2];
  const expectedHash = parts[3];

  if (!iterations || !salt || !expectedHash) {
    return false;
  }

  const hash = await pbkdf2Async(
    password,
    salt,
    iterations,
    KEY_LENGTH,
    DIGEST
  );

  return timingSafeEqualHex(hash.toString("hex"), expectedHash);
}

/* ------------------------------------------------------------------ */

function pbkdf2Async(
  password: string,
  salt: string,
  iterations: number,
  keylen: number,
  digest: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
