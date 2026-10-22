"use client";
import { auth } from "@/lib/firebase";
export async function ibApi(url: string, body?: object, method = "POST") {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Please sign in again.");
  const response = await fetch(url, { method: body ? method : "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store" });
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(response.status === 404
      ? "The IB admin service is not available in this app version. Restart the development server or redeploy the latest build."
      : "The IB service returned an unexpected response. Refresh the page; if it continues, restart or redeploy the app.");
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Unable to load IB Mathematics.");
  return result;
}
