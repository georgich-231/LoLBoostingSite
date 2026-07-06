import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { getRequiredEnv } from "@/server/config";

function encryptionKey() {
  const raw = getRequiredEnv("OAUTH_TOKEN_ENCRYPTION_KEY");
  const decoded = Buffer.from(raw, "base64");

  if (decoded.length === 32) {
    return decoded;
  }

  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(plaintext: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptSecret(ciphertext: string) {
  const [ivRaw, authTagRaw, encryptedRaw] = ciphertext.split(".");

  if (!ivRaw || !authTagRaw || !encryptedRaw) {
    throw new Error("Invalid encrypted secret payload");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivRaw, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTagRaw, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
