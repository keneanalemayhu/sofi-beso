// @/app/cashier/[branch]/page.tsx

import { CashierScreen } from "@/components/cashier/CashierScreen";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ branch: string }>;
}) {
  const { branch } = await params;
  if (branch === "main") redirect("/cashier");
  return <CashierScreen branchSlug={branch} />;
}