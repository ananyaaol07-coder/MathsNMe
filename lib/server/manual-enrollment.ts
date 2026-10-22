import { encryptionKey, seal, unseal } from "../enrollment/credentials";
import { randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import { FieldValue } from "firebase-admin/firestore";
import { serverAuth, serverDb } from "./firebase";
import { countries } from "../countries";


// A private encrypted outbox retains the SAME password across interrupted attempts.
// Successful delivery removes the encrypted credential. Never reset an active account.
export async function approvePayment(id: string, adminUid: string, reference: string) {
  if (!reference.trim() || reference.length > 200) throw new Error("Enter the bank transaction reference after verifying receipt.");
  encryptionKey();
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || !process.env.NEXT_PUBLIC_SITE_URL) throw new Error("Configure email and the site URL first.");
  const db = serverDb(), ref = db.doc(`webinarRegistrations/${id}`), jobRef = db.doc(`enrollmentCredentials/${id}`);
  const job = await db.runTransaction(async tx => {
    const booking = (await tx.get(ref)).data(), previous = (await tx.get(jobRef)).data();
    if (!booking || booking.status !== "done") throw new Error("Confirm attendance first.");
    if (booking.credentialsSentAt) return null;
    if (booking.accountUid && !previous) throw new Error("This account is already active. Use password recovery instead.");
    if ((previous?.leaseUntil || 0) > Date.now()) throw new Error("Account delivery is processing. Try again in five minutes.");
    const encryptedPassword = previous?.encryptedPassword || seal(randomBytes(24).toString("base64url"));
    tx.set(jobRef, { encryptedPassword, leaseUntil: Date.now() + 300000 });
    tx.update(ref, { paymentStatus: "paid", paymentVerifiedBy: booking.paymentVerifiedBy || adminUid, paidAt: booking.paidAt || Date.now(), paymentReference: booking.paymentReference || reference.trim(), credentialsStatus: "pending" });
    return { booking, encryptedPassword };
  });
  if (!job) return;
  try {
    const { booking } = job, password = unseal(job.encryptedPassword), uid = `webinar_${id}`;
    const email = booking.studentEmail || booking.parentEmail, auth = serverAuth();
    try { await auth.createUser({ uid, email, password, displayName: booking.studentName, disabled: true }); }
    catch (error) {
      if ((error as { code?: string }).code !== "auth/uid-already-exists") throw new Error("Account creation failed. Check whether the student's email is already registered.");
      const existing = await auth.getUser(uid);
      if (existing.email !== email) throw new Error("Account email does not match registration.");
    }
    const country = countries.find(item => item.name === booking.country);
    await db.runTransaction(async tx => {
      const profileRef = db.doc(`users/${uid}`), profile = await tx.get(profileRef);
      if (!profile.exists) tx.create(profileRef, {
        studentName: booking.studentName, grade: booking.grade, board: booking.board, country: booking.country, state: booking.state, city: "",
        guardianEmail: booking.parentEmail, phone: booking.parentPhone, countryCode: country?.code || "", dialCode: country?.dialCode || "",
        role: "student", currentLevel: 0, pretestCompleted: false, policyAccepted: false, policyAcceptedAt: null,
        createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(), enrollmentId: id,
      });
      tx.update(ref, { accountUid: uid, loginEmail: email, activatedAt: Date.now() });
    });
    await auth.updateUser(uid, { disabled: false });
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD!.replace(/\s/g, "") }, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000 });
    await transporter.sendMail({ from: { name: "MathsNMe", address: process.env.GMAIL_USER! }, to: booking.parentEmail, subject: "MathsNMe: payment confirmed and your child's login details", messageId: `<enrollment-${id}@mathsnme.local>`, text: `Hello ${booking.parentName},\n\nYour payment has been verified by our admin. ${booking.studentName}'s learning account is ready.\n\nLogin: ${process.env.NEXT_PUBLIC_SITE_URL!.replace(/\/$/, "")}/login\nEmail: ${email}\nPassword: ${password}\n\nKeep these credentials private. You can use Forgot password on the login page to choose a new password.\n\nMathsNMe` });
    const batch = db.batch();
    batch.update(ref, { credentialsSentAt: Date.now(), credentialsStatus: "sent" });
    batch.delete(jobRef);
    await batch.commit();
  } catch (error) {
    await jobRef.update({ leaseUntil: 0 });
    await ref.update({ credentialsStatus: "failed" });
    throw error;
  }
}
