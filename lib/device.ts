// @/lib/device.ts

"use client";
const STORAGE_KEY = "sofi-beso:device-id";

function makeId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16),
  );
}

/**
 * Stable per-tablet id. Generated once and kept in localStorage, so the
 * server can map this terminal to a branch. Clearing site data resets it
 * and the tablet will need pairing again.
 */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = makeId();
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function resetDeviceId() {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}