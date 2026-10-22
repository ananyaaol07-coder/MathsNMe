import { createHmac, timingSafeEqual } from "node:crypto";
import { feeForCountry } from "./fees.js";
export { feeForCountry } from "./fees.js";
export function validSignature(payload: string, signature: string, secret: string) {
  if (!secret || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(payload).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export function matchesCapturedPayment(payment: { status?: string; order_id?: string; amount?: number; currency?: string; amount_refunded?: number }, orderId: string, country: string) {
  const fee = feeForCountry(country);
  return payment.status === "captured" && payment.order_id === orderId && payment.amount === fee.amount && payment.currency === fee.currency && (payment.amount_refunded || 0) === 0;
}
