// @/app/api/print/route.ts

import { exec } from "child_process";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const escaped = text.replace(/"/g, '\\"');

    exec(
      `echo "${escaped}" | lp -d POS-80`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(error);
          return;
        }

        if (stderr) {
          console.error(stderr);
        }

        console.log(stdout);
      },
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Print failed" },
      { status: 500 },
    );
  }
}