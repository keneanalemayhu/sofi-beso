"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <Card className="w-full max-w-xl bg-slate-900/60 border-white/10 p-6 md:p-8">
        <div className="text-center">
          <div className="text-2xl md:text-3xl font-extrabold tracking-tight">
            ሶፊ በሶ
          </div>
          <div className="mt-2 text-sm text-white/70">
            ይምረጡ
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <Button
            onClick={() => router.push("/cashier")}
            className="h-16 text-lg font-extrabold bg-teal-500 text-slate-950 hover:bg-teal-400"
          >
            ካሸሪ
          </Button>

          <Button
            onClick={() => router.push("/kitchen")}
            className="h-16 text-lg font-extrabold bg-amber-400 text-slate-950 hover:bg-amber-300"
          >
            ኩሽና
          </Button>
        </div>

        <div className="mt-6 text-center text-xs text-white/50">
          አንዴ ብቻ ይንኩ
        </div>
      </Card>
    </div>
  );
}