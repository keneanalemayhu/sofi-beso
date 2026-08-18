/* eslint-disable @typescript-eslint/no-explicit-any */
// @/lib/api.ts

"use client";
import { API_BASE } from "@/lib/config";
import { getDeviceId } from "@/lib/device";

export class BranchError extends Error {
  code: string;
  slug?: string;
  constructor(code: string, slug?: string) {
    super(
      code === "UNKNOWN_BRANCH"
        ? `Unknown branch "${slug}".`
        : "No branch could be determined for this device.",
    );
    this.name = "BranchError";
    this.code = code;
    this.slug = slug;
  }
}

/** fetch with device id and branch slug attached. */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
  branchSlug?: string,
) {
  if (!API_BASE) throw new Error("Missing NEXT_PUBLIC_API_BASE");

  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": getDeviceId(),
      ...(branchSlug ? { "X-Branch-Slug": branchSlug } : {}),
      ...(init.headers || {}),
    },
  });

  if (res.status === 428 || res.status === 404) {
    const body = await res.clone().json().catch(() => ({}));
    if (body?.error === "UNKNOWN_BRANCH" || body?.error === "BRANCH_NOT_RESOLVED") {
      throw new BranchError(body.error, branchSlug);
    }
  }

  return res;
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit,
  branchSlug?: string,
): Promise<T> {
  const res = await apiFetch(path, init, branchSlug);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    throw new Error((data as any)?.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export type BranchInfo = {
  device_id: string;
  device_name: string | null;
  branch_id: string;
  branch_name: string;
  slug: string;
};

export function getBranchInfo(branchSlug?: string) {
  return apiJson<BranchInfo>("/branches/whoami", undefined, branchSlug);
}