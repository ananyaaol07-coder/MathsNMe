import nodemailer from "nodemailer";
import { serverDb } from "./firebase";

// Persisted outbox: failures remain eligible for retry by the scheduler.
export async function deliverNotification(id: string) {
  const db = serverDb(), ref = db.doc(`webinarNotifications/${id}`);
  const job = await db.runTransaction(async tx => {
    const snapshot = await tx.get(ref), data = snapshot.data();
    if (!data || data.sentAt || data.dueAt > Date.now() || (data.leaseUntil || 0) > Date.now()) return null;
    tx.update(ref, { leaseUntil: Date.now() + 60000 });
    return data;
  });
  if (!job) return;
  try {
    const booking = (await db.doc(`webinarRegistrations/${job.bookingId}`).get()).data();
    if (!booking) throw new Error("Booking missing");
    if (job.kind === "reminder" && booking.status === "done") {
      await ref.update({ sentAt: Date.now(), dueAt: null, skipped: true, leaseUntil: 0 });
      return;
    }
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) throw new Error("Email not configured");
    const reminder = job.kind === "reminder";
    const text = [
      reminder ? "The scheduled session has ended. Please review it and mark it as done in the admin dashboard." : "A parent has registered for a one-to-one MathsNMe Zoom webinar. Please send the Zoom link to the parent.",
      `Date: ${booking.date}, ${booking.time} IST (60 minutes)`,
      `Parent: ${booking.parentName}\nPhone: ${booking.parentPhone}\nEmail: ${booking.parentEmail}`,
      `Student: ${booking.studentName}\nPhone: ${booking.studentPhone}\nEmail: ${booking.studentEmail}`,
      `Grade: ${booking.grade}\nBoard: ${booking.board}\nCountry: ${booking.country}\nState: ${booking.state}`,
      process.env.NEXT_PUBLIC_SITE_URL ? `Admin: ${process.env.NEXT_PUBLIC_SITE_URL}/admin` : "Open the MathsNMe admin dashboard.",
    ].join("\n\n");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "") },
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    });
    await transporter.sendMail({
      from: { name: "MathsNMe", address: process.env.GMAIL_USER! },
      to: "rameshaol@gmail.com",
      subject: reminder ? "MathsNMe: webinar completion reminder" : "MathsNMe: new webinar registration",
      text, messageId: `<${id}@mathsnme-webinar.local>`,
    });
    await ref.update({ sentAt: Date.now(), dueAt: null, leaseUntil: 0, lastError: null });
  } catch {
    await ref.update({ leaseUntil: 0, lastError: "Delivery pending; check email configuration or provider status.", dueAt: Date.now() + 60000 });
  }
}
