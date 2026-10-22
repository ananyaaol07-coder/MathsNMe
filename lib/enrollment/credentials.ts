import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
export function encryptionKey() {
  const key = process.env.ENROLLMENT_CREDENTIAL_KEY || "";
  if (!/^[a-f0-9]{64}$/i.test(key)) throw new Error("Configure ENROLLMENT_CREDENTIAL_KEY before activating accounts.");
  return Buffer.from(key, "hex");
}
export function seal(password: string) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(value => value.toString("hex")).join(":");
}
export function unseal(value: string) {
  const [iv, tag, ciphertext] = value.split(":").map(part => Buffer.from(part, "hex"));
  const cipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(ciphertext), cipher.final()]).toString("utf8");
}
