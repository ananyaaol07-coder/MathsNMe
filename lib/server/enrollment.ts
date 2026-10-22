import { createHash } from "node:crypto";
import { serverDb } from "./firebase";
import { matchesCapturedPayment } from "../enrollment/payment";
export async function enrollmentFromRequest(request: Request) {
  const token = request.headers.get("x-enrollment-token") || "";
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("Invalid or missing enrollment link.");
  const db = serverDb();
  const invitation = (await db.doc(`webinarInvites/${createHash("sha256").update(token).digest("hex")}`).get()).data();
  if (!invitation) throw new Error("Invalid enrollment link.");
  const ref = db.doc(`webinarRegistrations/${invitation.bookingId}`), snapshot = await ref.get();
  const booking = snapshot.data();
  if (!booking || booking.status !== "done") throw new Error("Attendance must be confirmed before enrollment.");
  return { db, ref, booking, id: snapshot.id };
}
export async function razorpay(path: string, body?: object) {
  const key = process.env.RAZORPAY_KEY_ID, secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) throw new Error("Payments are not configured yet. Please contact MathsNMe.");
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("The payment provider could not complete this request. Please try again.");
  return response.json();
}
export async function recordPayment(bookingId: string, paymentId: string) {
  if (!/^pay_[A-Za-z0-9]+$/.test(paymentId)) throw new Error("Invalid payment reference.");
  const payment = await razorpay(`payments/${paymentId}`), db = serverDb();
  const ref = db.doc(`webinarRegistrations/${bookingId}`);
  await db.runTransaction(async tx => {
    const booking = (await tx.get(ref)).data();
    if (!booking || booking.status !== "done" || !matchesCapturedPayment(payment, booking.orderId, booking.country)) throw new Error("Payment is not captured or does not match this registration. Wait briefly, then check again.");
    if (booking.paymentStatus === "paid") return;
    tx.update(ref, { paymentStatus: "pending_admin", paymentId, paidAt: Date.now(), paidAmount: payment.amount, paidCurrency: payment.currency });
  });
}
