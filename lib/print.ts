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
  branchName?: string;
};

const AGENT_URL = "https://localhost:5051/print";
const AGENT_TIMEOUT_MS = 2500;

/**
 * Which path this terminal prints through. Decided on the first order and
 * kept for the session — a reload re-probes, so a restarted agent is picked
 * up without a code change.
 */
let printMode: "unknown" | "agent" | "browser" = "unknown";

function servingModeText(mode: ReceiptOrder["servingMode"]) {
  return mode === "shared_tray" ? "አንድ ላይ" : "የተለያዩ ትእዛዞች";
}

function splitCreatedAt(createdAt: string) {
  const separator = "፣ ";
  const idx = createdAt.indexOf(separator);
  return {
    time: idx !== -1 ? createdAt.slice(0, idx) : createdAt,
    date: idx !== -1 ? createdAt.slice(idx + separator.length) : "",
  };
}

// ============================================================
// PATH 1 — local print agent (main branch, Ubuntu)
// ============================================================

function renderCanvas(order: ReceiptOrder): string {
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

  ctx.textAlign = "left";
  ctx.font = "bold 28px serif";

  ctx.fillText(`አስተናጋጅ: ${order.waiterName}`, 20, y);
  y += 45;

  ctx.fillText(`አቀራረብ: ${servingModeText(order.servingMode)}`, 20, y);
  y += 38;

  ctx.font = "32px monospace";
  ctx.fillText("================================", 10, y);
  y += 55;

  for (const item of order.items) {
    ctx.font = "bold 38px serif";
    ctx.fillText(`${item.quantity} x ${item.name}`, 20, y);
    y += itemHeight;
  }

  ctx.font = "32px monospace";
  ctx.fillText("================================", 10, y);
  y += 80;

  const { time, date } = splitCreatedAt(order.createdAt);

  ctx.textAlign = "center";
  ctx.font = "bold 34px serif";
  ctx.fillText(time, 256, y);
  y += 42;

  ctx.font = "bold 30px serif";
  ctx.fillText(date, 256, y);

  return canvas.toDataURL("image/png");
}

async function printViaAgent(order: ReceiptOrder): Promise<void> {
  const imageBase64 = renderCanvas(order);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);

  try {
    const res = await fetch(AGENT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64 }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error("Local print agent failed");
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// PATH 2 — OS printer driver via the browser (imperial, Windows)
// ============================================================

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function receiptHtml(order: ReceiptOrder): string {
  const { time, date } = splitCreatedAt(order.createdAt);

  const rows = order.items
    .map(
      (i) =>
        `<div class="item">${i.quantity} x ${escapeHtml(i.name)}</div>` +
        (i.comment?.trim()
          ? `<div class="note">${escapeHtml(i.comment.trim())}</div>`
          : ""),
    )
    .join("");

  // Nyala ships with Windows and covers Ethiopic; Entoto is our bundled font.
  return `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Entoto';
    src: url('/fonts/entoto.ttf') format('truetype');
  }
  @page { size: 80mm auto; margin: 0; }
  * { -webkit-print-color-adjust: exact; }
  body {
    margin: 0; padding: 4mm 3mm; width: 72mm;
    font-family: 'Entoto', 'Nyala', 'Abyssinica SIL', serif;
    color: #000; background: #fff;
  }
  .title { text-align: center; font-size: 26px; font-weight: 700; }
  .sub   { text-align: center; font-size: 16px; margin-top: 2px; }
  .branch{ text-align: center; font-size: 18px; font-weight: 700; margin-top: 4px; }
  .info  { font-size: 15px; font-weight: 700; margin-top: 8px; }
  .rule  { border-top: 1px dashed #000; margin: 8px 0; }
  .item  { font-size: 21px; font-weight: 700; margin: 5px 0; }
  .note  { font-size: 14px; margin: 0 0 5px 10px; }
  .foot  { text-align: center; font-size: 17px; font-weight: 700; }
  .foot .date { font-size: 15px; margin-top: 3px; }
</style></head>
<body>
  <div class="title">ሶፊ በሶ</div>
  <div class="sub">የኩሽና ትእዛዝ</div>
  ${order.branchName ? `<div class="branch">${escapeHtml(order.branchName)}</div>` : ""}
  <div class="info">አስተናጋጅ: ${escapeHtml(order.waiterName)}</div>
  <div class="info">አቀራረብ: ${servingModeText(order.servingMode)}</div>
  <div class="rule"></div>
  ${rows}
  <div class="rule"></div>
  <div class="foot">
    <div>${escapeHtml(time)}</div>
    <div class="date">${escapeHtml(date)}</div>
  </div>
</body></html>`;
}

async function printViaBrowser(order: ReceiptOrder): Promise<void> {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("Could not open print frame");
  }

  doc.open();
  doc.write(receiptHtml(order));
  doc.close();

  // Wait for the font, or Amharic renders as boxes. Fail open after 1.5s
  // rather than block the cashier.
  await new Promise<void>((resolve) => {
    let settled = false;
    const done = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };
    setTimeout(done, 1500);
    const fonts = (doc as Document & { fonts?: FontFaceSet }).fonts;
    if (fonts) fonts.ready.then(done).catch(done);
    else done();
  });

  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();

  // Removing the frame too early cancels the job.
  setTimeout(() => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }, 3000);
}

// ============================================================

/**
 * Prints a kitchen ticket. Terminals running the local agent use it;
 * everything else prints through the OS printer driver.
 */
export async function printReceipt(order: ReceiptOrder): Promise<void> {
  if (printMode === "browser") return printViaBrowser(order);

  if (printMode === "agent") {
    try {
      return await printViaAgent(order);
    } catch (err) {
      // Agent died mid-service — keep printing rather than lose the ticket.
      console.warn("Print agent failed, falling back to browser print", err);
      printMode = "browser";
      return printViaBrowser(order);
    }
  }

  // First order this session: find out which path works.
  try {
    await printViaAgent(order);
    printMode = "agent";
  } catch {
    printMode = "browser";
    await printViaBrowser(order);
  }
}