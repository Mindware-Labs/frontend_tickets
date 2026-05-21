"use client";

import { Input } from "@/components/ui/input";
import { Search, MousePointerClick } from "lucide-react";

interface LandlordsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export function LandlordsToolbar({
  search,
  onSearchChange,
}: LandlordsToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
      <div className="relative flex-1 max-w-[420px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[14px] w-[14px] text-muted-foreground" />
        <Input
          placeholder="Search landlords by name, email, phone, or yard..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-[34px] pr-8 h-[30px] rounded-full text-[12.5px] bg-muted/30 border-border shadow-none focus-visible:ring-[#008f68]/30 focus-visible:border-[#008f68]/40"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 border border-border rounded px-1.5 py-[1px] text-[10px] text-muted-foreground font-mono bg-background">
          /
        </span>
      </div>

      <div className="flex items-center gap-1.5 px-1 text-[12px] font-medium text-muted-foreground lg:whitespace-nowrap">
        <MousePointerClick className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
        <span>Click a row to view landlord details.</span>
      </div>
    </div>
  );
}
