import { enrollmentFromRequest } from "@/lib/server/enrollment";
import { feeForCountry } from "@/lib/enrollment/payment";
export async function GET(request: Request) {
  try {
    const { booking } = await enrollmentFromRequest(request);
    return Response.json({ fee: feeForCountry(booking.country), paid: !!booking.paymentVerifiedBy, activated: !!booking.accountUid, credentialsSent: !!booking.credentialsSentAt }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ error: "Use the private enrollment link shared by admin." }, { status: 403 }); }
}
