import { validSignature } from "@/lib/enrollment/payment";
import { serverDb } from "@/lib/server/firebase";
import { recordPayment } from "@/lib/server/enrollment";
export async function POST(request: Request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get("x-razorpay-signature") || "", process.env.RAZORPAY_WEBHOOK_SECRET || "")) return Response.json({ error: "Invalid signature" }, { status: 401 });
  try {
    const event = JSON.parse(raw);
    if (!["payment.captured", "order.paid"].includes(event.event)) return Response.json({ ok: true });
    const payment = event.payload?.payment?.entity;
    if (!payment || !/^order_[A-Za-z0-9]+$/.test(payment.order_id)) throw new Error("Missing payment");
    const mapping = (await serverDb().doc(`webinarOrders/${payment.order_id}`).get()).data();
    if (!mapping) return Response.json({ error: "Order mapping is not ready" }, { status: 503 });
    await recordPayment(mapping.bookingId, payment.id);
    return Response.json({ ok: true });
  } catch { return Response.json({ error: "Payment processing failed; retry required" }, { status: 503 }); }
}
