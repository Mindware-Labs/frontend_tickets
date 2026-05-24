"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type CustomerSearchOption = {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
};

const normalizePhone = (v?: string | null) => (v ? v.replace(/\D/g, "") : "");
const stripUsCode = (d: string) =>
  d.length > 10 && d.startsWith("1") ? d.slice(1) : d;

export function matchesCustomerSearch(
  customer: CustomerSearchOption,
  rawSearch: string,
): boolean {
  const term = rawSearch.trim();
  if (!term) return false;

  const s = term.toLowerCase();
  const sd = normalizePhone(term);
  const sds = stripUsCode(sd);
  const phone = customer.phone ?? "";
  const cpd = normalizePhone(phone);
  const cpds = stripUsCode(cpd);

  const phoneMatch =
    !!sd &&
    (cpd.includes(sd) ||
      cpds.includes(sd) ||
      cpd.includes(sds) ||
      cpds.includes(sds));

  return (
    (customer.name ?? "").toLowerCase().includes(s) ||
    phone.toLowerCase().includes(s) ||
    customer.id.toString().includes(s) ||
    (customer.email ?? "").toLowerCase().includes(s) ||
    phoneMatch
  );
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { credentials: "include" });
  const result = await response.json();
  if (!result.success) throw new Error(result.message || "Failed to load");
  const payload = result.data;
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];
  return rows as CustomerSearchOption[];
};

const customerLabel = (customer?: CustomerSearchOption | null) => {
  if (!customer) return "";
  return customer.phone ? `${customer.name} · ${customer.phone}` : customer.name;
};

export function AsyncCustomerCombobox({
  value,
  onChange,
  selectedCustomer,
  placeholder = "Select customer...",
  searchPlaceholder = "Type a customer name or phone...",
  items = [],
}: {
  value: string;
  onChange: (value: string, customer?: CustomerSearchOption | null) => void;
  selectedCustomer?: CustomerSearchOption | null;
  placeholder?: string;
  searchPlaceholder?: string;
  noneLabel?: string;
  items?: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<CustomerSearchOption | null>(
    selectedCustomer ?? null,
  );

  useEffect(() => {
    setSelected(selectedCustomer ?? null);
  }, [selectedCustomer]);

  useEffect(() => {
    if (!value) setSelected(null);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const trimmedSearch = debouncedSearch.trim();
  const shouldSearch = open && trimmedSearch.length > 0;
  const query = shouldSearch
    ? `/api/customers?page=1&limit=20&search=${encodeURIComponent(trimmedSearch)}`
    : null;

  const { data = [], isLoading, isValidating } = useSWR(query, fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: false,
  });

  const options = useMemo(() => {
    const map = new Map<string, CustomerSearchOption>();
    if (selected) map.set(selected.id.toString(), selected);
    data.forEach((customer) => map.set(customer.id.toString(), customer));
    return Array.from(map.values());
  }, [data, selected]);

  const filteredOptions = useMemo(() => {
    if (!trimmedSearch) return [];
    return options.filter((customer) =>
      matchesCustomerSearch(customer, trimmedSearch),
    );
  }, [options, trimmedSearch]);

  const visibleSelected =
    selected ||
    options.find((customer) => customer.id.toString() === value) ||
    items
      .filter((item) => item.value === value)
      .map((item) => ({
        id: Number(item.value),
        name: item.label,
        phone: null,
      }))[0] ||
    null;
  const normalizedPlaceholder = placeholder.replace(/â€¦/g, "...");
  const normalizedSearchPlaceholder = searchPlaceholder.replace(/â€¦/g, "...");
  const showLoading =
    shouldSearch && (isLoading || (isValidating && filteredOptions.length === 0));

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex h-7 w-full items-center justify-between rounded-lg border border-transparent bg-slate-50 px-2.5 text-left text-xs transition-colors hover:border-slate-300 focus:border-[#008f68] focus:outline-none focus:ring-2 focus:ring-[#008f68]/20"
        >
          <span
            className={cn(
              "truncate",
              visibleSelected
                ? "font-medium text-slate-800"
                : "font-normal text-slate-400",
            )}
          >
            {customerLabel(visibleSelected) || normalizedPlaceholder}
          </span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 text-slate-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 shadow-xl" align="start">
        <div className="flex flex-col">
          <div className="border-b px-3 py-2">
            <Input
              placeholder={normalizedSearchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-xs"
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {!trimmedSearch ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Type to search customers.
              </div>
            ) : showLoading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-4 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Searching customers...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No customer found.
              </div>
            ) : (
              filteredOptions.map((customer) => {
                const id = customer.id.toString();
                const isSelected = value === id;
                return (
                  <div
                    key={id}
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-xs hover:bg-slate-100",
                      isSelected && "bg-slate-100",
                    )}
                    onClick={() => {
                      setSelected(customer);
                      onChange(id, customer);
                      setSearch("");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-0 h-3.5 w-3.5 shrink-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        {customer.name}
                      </p>
                      {customer.phone ? (
                        <p className="truncate text-[11px] text-slate-400">
                          {customer.phone}
                        </p>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
