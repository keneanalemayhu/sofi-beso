// @/app/api/print/route.ts

import { exec, execFile } from "child_process";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { text } = await req.json();

        console.log("PRINTING FROM SERVER");

        exec("hostname", (_err, stdout) => {
            console.log("HOSTNAME:", stdout.trim());
        });

        const child = execFile(
            "/usr/bin/lp",
            ["-d", "POS-80"],
            (error, stdout, stderr) => {
                if (error) {
                    console.error("print error:", error);
                    return;
                }

                if (stderr) {
                    console.error("print stderr:", stderr);
                }

                console.log("print stdout:", stdout);
            },
        );

        child.stdin?.write(text);
        child.stdin?.end();

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("route error:", err);

        return NextResponse.json({ error: "Print failed" }, { status: 500 });
    }
}