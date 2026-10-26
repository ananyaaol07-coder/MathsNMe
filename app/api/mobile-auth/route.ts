import { serverAuth } from "@/lib/server/firebase";

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
    if (!token) throw new Error("Missing token");
    const user = await serverAuth().verifyIdToken(token, true);
    const customToken = await serverAuth().createCustomToken(user.uid);
    return Response.json({ customToken }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Unable to connect this app session." }, { status: 401 });
  }
}
