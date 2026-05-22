"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  contentClassName,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <Select
      value={value || "none"}
      onValueChange={(v) => onChange(v === "none" ? "" : v)}
    >
      <SelectTrigger className="h-7 text-xs bg-slate-50 border-transparent hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-[#008f68]/20 focus:border-[#008f68] rounded-lg w-full transition-colors">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>{children}</SelectContent>
    </Select>
  );
}

// ── Searchable combobox (Popover + Command) ───────────────────────────────────
export function InspectorCombobox({
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyLabel = "No results",
  noneLabel = "None",
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  noneLabel?: string;
  items: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-7 w-full flex items-center justify-between px-2.5 text-xs bg-slate-50 border border-transparent hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#008f68]/20 focus:border-[#008f68] rounded-lg transition-colors"
        >
          <span
            className={cn(
              "truncate",
              selected
                ? "text-slate-800 font-medium"
                : "text-slate-400 font-normal",
            )}
          >
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-52 p-0 shadow-xl border-slate-200"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={searchPlaceholder}
            className="text-xs h-8"
          />
          <CommandList>
            <CommandEmpty>{emptyLabel}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange("");
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-3.5 w-3.5",
                    !value ? "opacity-100" : "opacity-0",
                  )}
                />
                {noneLabel}
              </CommandItem>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-3.5 w-3.5",
                      value === item.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
