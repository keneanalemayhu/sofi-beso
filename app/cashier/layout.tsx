import type { Metadata } from "next";

export default function CashierLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; } export const metadata: Metadata = {
  title: "Cashier",
  description: "Created by Kenean Alemayhu",
};