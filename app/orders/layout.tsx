import type { Metadata } from "next";

export default function OrdersLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; } export const metadata: Metadata = {
  title: "Orders",
  description: "Created by Kenean Alemayhu",
};