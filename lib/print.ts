// @/lib/print.ts

import fs from "fs";
import os from "os";
import path from "path";
import PDFDocument from "pdfkit";
import { execFile } from "child_process";

const PRINTER_NAME = "POS-80C";
const SUMATRA = "C:\\Program Files\\SumatraPDF\\SumatraPDF.exe";

type KitchenReceiptOrder = {
  orderId?: string;
  waiterName: string;
  servingMode: "individual" | "shared_tray";
  items: {
    name: string;
    quantity: number;
    comment?: string | null;
  }[];
  total: number;
  createdAt: string;
};

export async function printKitchenReceipt(order: KitchenReceiptOrder) {
  const filePath = path.join(os.tmpdir(), `receipt-${Date.now()}.pdf`);
  const fontPath = path.join(
    process.cwd(),
    "public",
    "fonts",
    "entoto.ttf",
  );

  await new Promise<void>((resolve, reject) => {
    const pageWidth = 226;
    const pageHeight = 1800;
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    const doc = new PDFDocument({
      size: [pageWidth, pageHeight],
      margin,
      autoFirstPage: false,
    });

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.registerFont("ethiopic", fontPath);
    doc.font("ethiopic");

    doc.addPage({
      size: [pageWidth, pageHeight],
      margin,
    });

    const center = (value: string, size = 18, gap = 0.4) => {
      doc.fontSize(size).text(value, {
        width: contentWidth,
        align: "center",
        lineGap: 4,
      });
      doc.moveDown(gap);
    };

    const left = (value: string, size = 18, gap = 0.35) => {
      doc.fontSize(size).text(value, {
        width: contentWidth,
        align: "left",
        lineGap: 5,
      });
      doc.moveDown(gap);
    };

    const divider = () => {
      center("━━━━━━━━━━━━━━", 16, 0.45);
    };

    const itemCount = order.items.reduce(
      (sum: number, item) => sum + item.quantity,
      0,
    );

    const formattedTime = new Date(order.createdAt).toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    doc.moveDown(1.2);

    center("KITCHEN", 30, 0.1);
    center("ORDER", 30, 0.5);

    divider();

    center(
      order.servingMode === "shared_tray" ? "SHARED TRAY" : "INDIVIDUAL",
      22,
      0.5,
    );

    center(`ITEMS: ${itemCount}`, 20, 0.5);

    divider();

    for (const item of order.items) {
      left(`${item.quantity} × ${item.name}`.toUpperCase(), 26, 0.45);

      if (item.comment?.trim()) {
        left(`NOTE: ${item.comment.trim()}`, 17, 0.6);
      }
    }

    divider();

    center(`TOTAL: ${order.total}`, 22, 0.4);
    center(`WAITER: ${order.waiterName}`.toUpperCase(), 20, 0.4);
    center(formattedTime, 16, 0.4);

    if (order.orderId) {
      center(`ORDER: ${order.orderId}`, 10, 0.3);
    }

    doc.moveDown(9);

    doc.end();

    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  await new Promise<void>((resolve, reject) => {
    execFile(
      SUMATRA,
      ["-print-to", PRINTER_NAME, "-silent", "-exit-on-print", filePath],
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(stderr || stdout || err.message));
          return;
        }

        resolve();
      },
    );
  });

  fs.unlink(filePath, () => { });
}