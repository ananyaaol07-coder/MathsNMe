"use client";
import { auth } from "@/lib/firebase";
export async function profileApi(url: string, body?: object) {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Please sign in again.");
  const response = await fetch(url, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), cache: "no-store" });
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("Settings are currently unavailable. Please retry.");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Unable to load settings.");
  return data;
}
