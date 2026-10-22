export async function POST() {
  return Response.json({ error: "Pay using the QR code sent on WhatsApp. Admin will verify your payment." }, { status: 410 });
}
