// @/lib/print.ts

"use client";
import type { CartItem } from "@/types/cart";

/** Client-generated id so an order can be de-duplicated on retry. */
export function createLocalId(): string {
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16),
  );
}

export type ReceiptOrder = {
  orderId: string;
  waiterName: string;
  servingMode: "individual" | "shared_tray";
  items: CartItem[];
  total: number;
  /** Pre-formatted "time፣ date" string from useCalendar. */
  createdAt: string;
  /** Printed under the title when the restaurant has more than one branch. */
  branchName?: string;
};

/**
 * Renders the kitchen ticket to a canvas and POSTs it to the tablet's local
 * print agent. Each terminal runs its own agent on :5051.
 */
export async function printReceipt(order: ReceiptOrder) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;

  const itemHeight = 58;
  const headerHeight = order.branchName ? 350 : 310;
  const footerHeight = 150;

  canvas.height = headerHeight + order.items.length * itemHeight + footerHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";

  // HEADER
  ctx.textAlign = "center";
  ctx.font = "bold 46px serif";
  ctx.fillText("ሶፊ በሶ", 256, 60);

  ctx.font = "30px serif";
  ctx.fillText("የኩሽና ትእዛዝ", 256, 105);

  let y = 165;

  if (order.branchName) {
    ctx.font = "bold 32px serif";
    ctx.fillText(order.branchName, 256, 145);
    y = 205;
  }

  // INFO
  ctx.textAlign = "left";
  ctx.font = "bold 28px serif";

  ctx.fillText(`አስተናጋጅ: ${order.waiterName}`, 20, y);
  y += 45;

  const servingModeText =
    order.servingMode === "shared_tray" ? "አንድ ላይ" : "የተለያዩ ትእዛዞች";

  ctx.fillText(`አቀራረብ: ${servingModeText}`, 20, y);
  y += 38;

  ctx.font = "32px monospace";
  ctx.fillText("================================", 10, y);
  y += 55;

  // ITEMS
  for (const item of order.items) {
    ctx.font = "bold 38px serif";
    ctx.fillText(`${item.quantity} x ${item.name}`, 20, y);
    y += itemHeight;
  }

  ctx.font = "32px monospace";
  ctx.fillText("================================", 10, y);
  y += 80;

  // FOOTER
  ctx.textAlign = "center";
  ctx.font = "bold 34px serif";

  const separator = "፣ ";
  const separatorIndex = order.createdAt.indexOf(separator);

  const timePart =
    separatorIndex !== -1
      ? order.createdAt.slice(0, separatorIndex)
      : order.createdAt;

  const datePart =
    separatorIndex !== -1
      ? order.createdAt.slice(separatorIndex + separator.length)
      : "";

  ctx.fillText(timePart, 256, y);
  y += 42;

  ctx.font = "bold 30px serif";
  ctx.fillText(datePart, 256, y);

  const imageBase64 = canvas.toDataURL("image/png");

  const res = await fetch("https://localhost:5051/print", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 }),
  });

  if (!res.ok) {
    throw new Error("Local print agent failed");
  }
}