// @/app/api/print/route.ts

import { NextResponse } from "next/server";
import { printKitchenReceipt } from "@/lib/print";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    await printKitchenReceipt(body.order);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PRINT ERROR:", err);

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}