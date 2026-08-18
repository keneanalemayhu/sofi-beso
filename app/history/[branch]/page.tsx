// @/app/orders-history/[branch]/page.tsx

import { OrdersHistoryScreen } from "@/components/history/OrdersHistoryScreen";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ branch: string }>;
}) {
  const { branch } = await params;
  if (branch === "main") redirect("/orders-history");
  return <OrdersHistoryScreen branchSlug={branch} />;
}