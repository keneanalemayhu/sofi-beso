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
  items: CartItem[];
  /** "time፣ date" (or "time, date") string from useCalendar.formatDateTime. */
  createdAt: string;
};

const AGENT_BASE = "https://localhost:5051";
/** How long to wait for the agent to answer "are you there?". */
const AGENT_PROBE_TIMEOUT_MS = 1000;
/** How long a print may take before we stop waiting (printing runs in the background). */
const AGENT_PRINT_TIMEOUT_MS = 20000;
/** After finding no agent, check again at most this often. */
const AGENT_REPROBE_MS = 60000;

/**
 * Which path this terminal prints through. Terminals running the local print
 * agent (main branch, Ubuntu) use it; others print through the browser and
 * the OS printer driver (imperial, Windows).
 */
let printMode: "unknown" | "agent" | "browser" = "unknown";
let lastProbeAt = 0;

/**
 * "05:24 AM፣ ረቡዕ፣ ህዳር 9 2019" → "ረቡዕ፣ ህዳር 9 2019  05:24":
 * date and time on one line, without AM/PM.
 */
export function ticketDateTime(createdAt: string): string {
  const match = createdAt.match(/^(.*?)(?:፣ |, )(.*)$/);
  const time = (match ? match[1] : createdAt)
    .replace(/\s*(AM|PM|am|pm)\s*$/, "")
    .trim();
  const date = match ? match[2].trim() : "";
  return date ? `${date}  ${time}` : time;
}

// ============================================================
// Ticket layout: waiter, items (with notes), date and time.
// ============================================================

const WIDTH = 512; // printable dots on an 80 mm printer
const MARGIN = 16;
const WAITER_FONT = "bold 34px serif";
const ITEM_FONT = "bold 38px serif";
const NOTE_FONT = "28px serif";
const DATE_FONT_SIZE = 28;

/** Splits text into lines that fit `maxWidth` with the context's current font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

type Line = { text: string; font: string; height: number; x: number };

function layoutTicket(ctx: CanvasRenderingContext2D, order: ReceiptOrder) {
  const lines: Line[] = [];
  const usable = WIDTH - MARGIN * 2;

  ctx.font = WAITER_FONT;
  for (const text of wrap(ctx, order.waiterName, usable)) {
    lines.push({ text, font: WAITER_FONT, height: 46, x: MARGIN });
  }
  lines.push({ text: "", font: WAITER_FONT, height: 14, x: MARGIN });

  for (const item of order.items) {
    ctx.font = ITEM_FONT;
    const itemLines = wrap(ctx, `${item.quantity} x ${item.name}`, usable);
    itemLines.forEach((text, i) =>
      lines.push({ text, font: ITEM_FONT, height: 52, x: i ? MARGIN + 40 : MARGIN }),
    );

    const note = item.comment?.trim();
    if (note) {
      ctx.font = NOTE_FONT;
      for (const text of wrap(ctx, note, usable - 40)) {
        lines.push({ text, font: NOTE_FONT, height: 38, x: MARGIN + 40 });
      }
    }
    lines.push({ text: "", font: ITEM_FONT, height: 8, x: MARGIN });
  }

  // Date and time on one line, shrunk if needed so it never wraps.
  const dateText = ticketDateTime(order.createdAt);
  let size = DATE_FONT_SIZE;
  ctx.font = `bold ${size}px serif`;
  while (size > 18 && ctx.measureText(dateText).width > usable) {
    size -= 2;
    ctx.font = `bold ${size}px serif`;
  }
  lines.push({ text: "", font: ctx.font, height: 10, x: MARGIN });
  lines.push({ text: dateText, font: `bold ${size}px serif`, height: size + 14, x: MARGIN });

  return lines;
}

function renderCanvas(order: ReceiptOrder): string {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const lines = layoutTicket(ctx, order);
  const top = 12;
  const bottom = 12;
  // Resizing the canvas resets its state, so lay out first, then size, then draw.
  canvas.height = top + lines.reduce((h, l) => h + l.height, 0) + bottom;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  let y = top;
  for (const line of lines) {
    y += line.height;
    if (!line.text) continue;
    ctx.font = line.font;
    // Baseline a little above the bottom of the line box.
    ctx.fillText(line.text, line.x, y - Math.round(line.height * 0.22));
  }

  return canvas.toDataURL("image/png");
}

// ============================================================
// PATH 1 — local print agent (main branch, Ubuntu)
// ============================================================

async function fetchWithTimeout(url: string, init: RequestInit, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function agentIsUp(): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      `${AGENT_BASE}/health`,
      { cache: "no-store" },
      AGENT_PROBE_TIMEOUT_MS,
    );
    return res.ok;
  } catch {
    return false;
  }
}

/** Thrown when the agent could not be reached at all (not running). */
class AgentUnreachable extends Error {}

async function printViaAgent(order: ReceiptOrder): Promise<void> {
  const imageBase64 = renderCanvas(order);

  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${AGENT_BASE}/print`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      },
      AGENT_PRINT_TIMEOUT_MS,
    );
  } catch (err) {
    // A timeout means the agent took the job but the printer is slow or
    // stuck: printing again elsewhere could give the kitchen two tickets.
    if ((err as Error)?.name === "AbortError") {
      throw new Error("The printer did not finish in time");
    }
    throw new AgentUnreachable("Print agent is not running");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string })?.error || "Printer error");
  }
}

// ============================================================
// PATH 2 — OS printer driver via the browser (imperial, Windows)
// ============================================================

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function receiptHtml(order: ReceiptOrder): string {
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
    margin: 0; padding: 3mm 3mm; width: 72mm;
    font-family: 'Entoto', 'Nyala', 'Abyssinica SIL', serif;
    color: #000; background: #fff;
  }
  .waiter { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
  .item   { font-size: 21px; font-weight: 700; margin: 4px 0; }
  .note   { font-size: 14px; margin: 0 0 4px 10px; }
  .when   { font-size: 15px; font-weight: 700; margin-top: 8px; white-space: nowrap; }
</style></head>
<body>
  <div class="waiter">${escapeHtml(order.waiterName)}</div>
  ${rows}
  <div class="when">${escapeHtml(ticketDateTime(order.createdAt))}</div>
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

  const frameWindow = iframe.contentWindow as
    | (Window & { print: () => void; focus: () => void })
    | null;

  frameWindow?.focus();
  frameWindow?.print();

  // Removing the frame too early cancels the job.
  setTimeout(() => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  }, 3000);
}

// ============================================================

async function printNow(order: ReceiptOrder): Promise<void> {
  if (
    printMode === "unknown" ||
    (printMode === "browser" && Date.now() - lastProbeAt > AGENT_REPROBE_MS)
  ) {
    lastProbeAt = Date.now();
    printMode = (await agentIsUp()) ? "agent" : "browser";
  }

  if (printMode === "browser") return printViaBrowser(order);

  try {
    await printViaAgent(order);
  } catch (err) {
    if (!(err instanceof AgentUnreachable)) throw err;
    // The agent stopped: print this ticket through the browser and look
    // for the agent again later.
    console.warn("Print agent not reachable, printing through the browser", err);
    printMode = "browser";
    lastProbeAt = Date.now();
    await printViaBrowser(order);
  }
}

/** Tickets print one after another, in the order they were sent. */
let queue: Promise<void> = Promise.resolve();

/**
 * Prints a kitchen ticket. Returns as soon as the ticket is queued would be
 * too early to report errors, so the promise settles when this ticket has
 * printed (or failed); callers should not make the cashier wait for it.
 */
export function printReceipt(order: ReceiptOrder): Promise<void> {
  const job = queue.then(() => printNow(order));
  queue = job.catch(() => undefined);
  return job;
}
