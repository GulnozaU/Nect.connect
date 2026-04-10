import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGO = "aes-256-gcm";
const IV_LEN = 16;
const SALT = "forge-linkedin-token-v1";

function getKey(): Buffer {
  const secret = process.env.LINKEDIN_TOKEN_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error(
      "LINKEDIN_TOKEN_ENCRYPTION_KEY must be set (min 32 chars recommended; used as passphrase for scrypt)"
    );
  }
  return scryptSync(secret, SALT, 32);
}

/** Encrypt LinkedIn access token for storage in Postgres (server-only). */
export function encryptLinkedInToken(plain: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

/** Decrypt stored token (server-only, e.g. background jobs). */
export function decryptLinkedInToken(blob: string): string {
  const key = getKey();
  const buf = Buffer.from(blob, "base64");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + 16);
  const data = buf.subarray(IV_LEN + 16);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8"
  );
}
