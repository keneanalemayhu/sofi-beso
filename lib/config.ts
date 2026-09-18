// @/lib/config.ts

export type Branch = "main" | "imperial";

const BRANCH_STORAGE_KEY = "sofi-beso-branch";

const CLOUD_API_BASE = "https://os.sofi-beso.et";

// Per-branch localhost port, in case both backends ever run side by side
// during testing. Adjust if each branch's local backend runs on the same
// port instead.
const LOCAL_API_BASE: Record<Branch, string> = {
  main: "http://localhost:4000",
  imperial: "http://localhost:4001",
};

/** Reads the branch chosen in the Header dropdown. Null until first pick. */
export function getBranch(): Branch | null {
  if (typeof window === "undefined") return null;
  const saved = window.localStorage.getItem(BRANCH_STORAGE_KEY);
  return saved === "main" || saved === "imperial" ? saved : null;
}

export function setBranch(branch: Branch): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BRANCH_STORAGE_KEY, branch);
}

// TODO: once online/offline detection exists, this should return
// LOCAL_API_BASE when the cloud is unreachable instead of always cloud.
export function getApiBase(): string {
  return CLOUD_API_BASE;
}

export const CASHIER_USER_ID = process.env.NEXT_PUBLIC_CASHIER_USER_ID || "";

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";