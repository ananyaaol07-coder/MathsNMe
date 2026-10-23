export type ContactField = "email" | "phone";
export type ContactRequest = { id: string; field: ContactField; currentValue: string; requestedValue: string; reason: string; status: string; requestedAt: number; studentName: string };
export function validateContactRequest(input: unknown, current: { guardianEmail?: unknown; phone?: unknown; dialCode?: unknown }) {
  if (!input || typeof input !== "object") throw new Error("Enter the contact details you want to change.");
  const { field, value, reason } = input as Record<string, unknown>;
  if (field !== "email" && field !== "phone") throw new Error("Choose email or phone number.");
  if (typeof value !== "string" || value.length > 320) throw new Error("Enter a valid contact value.");
  if (typeof reason !== "string" || reason.trim().length > 1000) throw new Error("Keep your reason within 1,000 characters.");
  const requestedValue = field === "email" ? value.trim().toLowerCase() : value.replace(/[\s()-]/g, "");
  if (field === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestedValue)) throw new Error("Enter a valid email address.");
  if (field === "phone" && !/^\+[1-9]\d{6,14}$/.test(requestedValue)) throw new Error("Enter a phone number with its country code, for example +919876543210.");
  const phone = String(current.phone || "").replace(/[\s()-]/g, "");
  const currentValue = field === "email" ? String(current.guardianEmail || "") : phone.startsWith("+") ? phone : `${current.dialCode || ""}${phone}`;
  if (requestedValue.toLowerCase() === currentValue.toLowerCase()) throw new Error("Enter a different value from your current contact details.");
  return { field, requestedValue, currentValue, reason: reason.trim() };
}
