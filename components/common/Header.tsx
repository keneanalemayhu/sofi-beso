// @/components/common/Header.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Store } from "lucide-react";
import { setBranch, type Branch } from "@/lib/config";

const BRANCH_LABELS: Record<Branch, string> = {
  main: "Main",
  imperial: "Imperial",
};

function branchFromPathname(pathname: string): Branch {
  return pathname.startsWith("/cashier/imperial") ? "imperial" : "main";
}

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [branch, setBranchState] = useState<Branch>(() =>
    branchFromPathname(pathname),
  );

  useEffect(() => {
    setBranchState(branchFromPathname(pathname));
  }, [pathname]);

  function handleChange(next: Branch) {
    setBranch(next);
    router.push(next === "main" ? "/cashier" : `/cashier/${next}`);
  }

  return (
    <div className="flex h-9 items-center gap-2 rounded-md border border-white/10 bg-slate-800/70 px-3 text-white">
      <Store className="h-4 w-4 text-amber-300" />

      <select
        value={branch}
        onChange={(e) => handleChange(e.target.value as Branch)}
        className="bg-transparent text-[12px] font-semibold text-white outline-none [&>option]:bg-slate-800 [&>option]:text-white"
      >
        <option value="main">{BRANCH_LABELS.main}</option>
        <option value="imperial">{BRANCH_LABELS.imperial}</option>
      </select>
    </div>
  );
};

export default Header;