// @/app/cashier/page.tsx

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CashierScreen } from "@/components/cashier/CashierScreen";
import { getBranch } from "@/lib/config";

export default function Page() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getBranch() === "imperial") {
      router.replace("/cashier/imperial");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) return null;
  return <CashierScreen branchSlug="main" />;
}