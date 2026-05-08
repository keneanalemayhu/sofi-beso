// // @/lib/print.ts

// import fs from "fs/promises";
// import os from "os";
// import path from "path";
// import { execFile } from "child_process";

// const PRINTER_NAME = "POS-80C";

// type KitchenReceiptOrder = {
//   orderId?: string;
//   waiterName: string;
//   servingMode: "individual" | "shared_tray";
//   items: {
//     name: string;
//     quantity: number;
//     comment?: string | null;
//   }[];
//   total: number;
//   createdAt: string;
// };

// export async function printKitchenReceipt(order: KitchenReceiptOrder) {
//   const filePath = path.join(os.tmpdir(), `receipt-${Date.now()}.txt`);

//   const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

//   const formattedTime = new Date(order.createdAt).toLocaleString("en-GB", {
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//     hour: "2-digit",
//     minute: "2-digit",
//   });

//   const receipt = [
//     "SOFI BESO",
//     "KITCHEN ORDER",
//     "------------------------",
//     order.servingMode === "shared_tray" ? "SHARED TRAY" : "INDIVIDUAL",
//     `ITEMS: ${itemCount}`,
//     "------------------------",
//     ...order.items.flatMap((item) => [
//       `${item.quantity} x ${item.name}`,
//       item.comment?.trim() ? `NOTE: ${item.comment.trim()}` : "",
//       "",
//     ]),
//     "------------------------",
//     `TOTAL: ${order.total}`,
//     `WAITER: ${order.waiterName}`,
//     formattedTime,
//     order.orderId ? `ORDER: ${order.orderId}` : "",
//     "",
//     "",
//     "",
//   ]
//     .filter(Boolean)
//     .join("\n");

//   await fs.writeFile(filePath, receipt, "utf8");

//   await new Promise<void>((resolve, reject) => {
//     execFile(
//       "/usr/bin/lp",
//       ["-d", PRINTER_NAME, "-o", "raw", filePath],
//       (err, stdout, stderr) => {
//         if (err) {
//           reject(new Error(stderr || stdout || err.message));
//           return;
//         }

//         resolve();
//       },
//     );
//   });

//   await fs.unlink(filePath).catch(() => { });
// }