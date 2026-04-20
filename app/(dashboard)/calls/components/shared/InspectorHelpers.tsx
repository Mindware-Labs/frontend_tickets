"use client";

import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InspLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">
      {children}
    </p>
  );
}

export function InspectorSelect({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  children: React.ReactNode;
}) {
  return (
    <Select
      value={value || "none"}
      onValueChange={(v) => onChange(v === "none" ? "" : v)}
    >
      <SelectTrigger className="h-7 text-xs bg-slate-50 border-transparent hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-[#008f68]/20 focus:border-[#008f68] rounded-lg w-full transition-colors">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}
