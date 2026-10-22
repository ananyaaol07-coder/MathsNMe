import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function serverDb() {
  let app = getApps().find(app => app.name === "webinar-server");
  if (!app) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) throw new Error("Server database configuration is missing.");
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    app = initializeApp({ projectId, credential: clientEmail && privateKey ? cert({ projectId, clientEmail, privateKey }) : applicationDefault() }, "webinar-server");
  }
  return getFirestore(app);
}
export async function requireAdmin(request: Request) {
  const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!token) throw new Error("Unauthorized");
  const db = serverDb();
  const app = getApps().find(app => app.name === "webinar-server")!;
  const user = await getAuth(app).verifyIdToken(token, true);
  if ((await db.doc(`admins/${user.uid}`).get()).data()?.active !== true) throw new Error("Unauthorized");
  return user.uid;
}

export function serverAuth() {
  serverDb();
  return getAuth(getApps().find(app => app.name === "webinar-server")!);
}
