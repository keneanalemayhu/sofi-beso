// @/app/api/print/route.ts

import { exec } from "child_process";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    console.log("PRINTING FROM SERVER");

    exec("hostname", (err, stdout, stderr) => {
      if (err) {
        console.error("hostname error:", err);
        return;
      }

      if (stderr) {
        console.error("hostname stderr:", stderr);
      }

      console.log("HOSTNAME:", stdout.trim());
    });

    const escaped = text.replace(/"/g, '\\"');

    exec(`echo "${escaped}" | lp -d POS-80`, (error, stdout, stderr) => {
      if (error) {
        console.error("print error:", error);
        return;
      }

      if (stderr) {
        console.error("print stderr:", stderr);
      }

      console.log("print stdout:", stdout);
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);

    return NextResponse.json({ error: "Print failed" }, { status: 500 });
  }
}