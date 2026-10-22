import { enrollmentFromRequest, recordPayment } from "@/lib/server/enrollment";
import { validSignature } from "@/lib/enrollment/payment";
export async function POST(request: Request) {
  try {
    const { booking, id } = await enrollmentFromRequest(request);
    const body = await request.json();
    if (!booking.orderId || body.razorpay_order_id !== booking.orderId || typeof body.razorpay_payment_id !== "string" || typeof body.razorpay_signature !== "string" || !validSignature(`${booking.orderId}|${body.razorpay_payment_id}`, body.razorpay_signature, process.env.RAZORPAY_KEY_SECRET || "")) throw new Error("Payment signature could not be verified.");
    await recordPayment(id, body.razorpay_payment_id);
    return Response.json({ awaitingAdmin: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Payment verification failed." }, { status: 400 }); }
}
