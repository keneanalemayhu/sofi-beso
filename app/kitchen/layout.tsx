import type { Metadata } from "next";

export default function KitchenLayout({ children }: { children: React.ReactNode }) { return <>{children}</>; } export const metadata: Metadata = {
  title: "Kitchen",
  description: "Created by Kenean Alemayhu",
};