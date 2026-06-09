"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";

import { IncomingCallModal } from "@/components/calls/incoming-call-modal";
import {
  useCustomerProfile,
  useCustomersList,
} from "@/components/calls/incoming-call-modal-api";
import type {
  CallDirection,
  CallState,
  IncomingCallContext,
} from "@/components/calls/incoming-call-modal-types";
import { useRole } from "@/components/providers/role-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const SIMULATED_LINE = "Dev Incoming Lab";

const stateOptions: Array<{ value: CallState; label: string; icon: typeof Clock3 }> = [
  { value: "RINGING", label: "Ringing", icon: PhoneIncoming },
  { value: "ACTIVE", label: "Active", icon: Activity },
  { value: "ENDED", label: "Ended", icon: CheckCircle2 },
];

function formatLastContact(value?: string) {
  if (!value) return "No recent contact";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No recent contact";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function IncomingCallLabPage() {
  const router = useRouter();
  const { role } = useRole();
  const normalizedRole = role?.toString().toLowerCase();
  const [accessState, setAccessState] = useState<"checking" | "allowed">(
    "checking",
  );

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const [direction, setDirection] = useState<CallDirection>("INBOUND");
  const [callState, setCallState] = useState<CallState>("RINGING");
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [answeredAt, setAnsweredAt] = useState<string | undefined>(undefined);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("user_data") : null;
    let storedRole = "";
    try {
      storedRole = String(JSON.parse(stored || "{}")?.role || "").toLowerCase();
    } catch {
      storedRole = "";
    }

    const effectiveRole = storedRole || normalizedRole;
    if (effectiveRole === "dev") {
      setAccessState("allowed");
      return;
    }

    if (effectiveRole) {
      router.replace("/dashboard");
    }
  }, [normalizedRole, router]);

  const hasDevAccess = accessState === "allowed";

  const {
    customers,
    loading: customersLoading,
    error: customersError,
    refresh,
  } = useCustomersList({
    enabled: hasDevAccess,
    limit: 25,
    search: debouncedSearch,
  });

  useEffect(() => {
    if (!selectedCustomerId && customers && customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }
  }, [customers, selectedCustomerId]);

  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useCustomerProfile(selectedCustomerId, { limit: 75 });

  const selectedOption = useMemo(
    () => customers?.find((customer) => customer.id === selectedCustomerId),
    [customers, selectedCustomerId],
  );

  const call = useMemo<IncomingCallContext>(
    () => ({
      direction,
      state: callState,
      lineLabel: SIMULATED_LINE,
      startedAt,
      answeredAt,
    }),
    [answeredAt, callState, direction, startedAt],
  );

  const resetCall = (nextState: CallState = "RINGING") => {
    const now = new Date().toISOString();
    setStartedAt(now);
    setAnsweredAt(nextState === "ACTIVE" ? now : undefined);
    setCallState(nextState);
  };

  const handleStateChange = (nextState: CallState) => {
    setCallState(nextState);
    if (nextState === "ACTIVE") {
      setAnsweredAt((current) => current ?? new Date().toISOString());
    }
  };

  if (!hasDevAccess) {
    return (
      <main className="flex h-screen items-center justify-center px-4">
        <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          Checking developer access...
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col gap-4 bg-slate-50 px-4 py-4 dark:bg-slate-950">
      <header className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-end">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#008f68]">
            Dev tool
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
            Incoming call lab
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Select a real customer from the database and preview the exact incoming call modal with that customer's profile, notes, calls, tickets, and manual records.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => resetCall("RINGING")}
          className="h-9 gap-2 bg-[#008f68] text-white hover:bg-[#007a5a]"
        >
          <PhoneCall className="h-4 w-4" />
          New simulated call
        </Button>
      </header>

      <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-100 p-3 dark:border-slate-800">
            <label
              htmlFor="customer-search"
              className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500"
            >
              Customer
            </label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="customer-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or phone"
                className="h-9 pl-9 text-sm"
              />
            </div>
          </div>

          <div className="min-h-[240px] flex-1 overflow-y-auto p-2">
            {customersLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Loading customers
              </div>
            ) : customersError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Could not load customers
                </div>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="mt-2 text-xs font-bold underline underline-offset-2"
                >
                  Retry
                </button>
              </div>
            ) : customers && customers.length > 0 ? (
              <div className="space-y-1">
                {customers.map((customer) => {
                  const active = customer.id === selectedCustomerId;
                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(customer.id);
                        resetCall("RINGING");
                      }}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        active
                          ? "border-[#008f68]/25 bg-[#f0faf5] text-slate-950 ring-1 ring-[#008f68]/15 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-white"
                          : "border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-900/50",
                      )}
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 dark:border-slate-800 dark:bg-slate-950">
                        <UserRound className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {customer.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                          {customer.phone}
                        </span>
                        <span className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                          <span>{customer.callCount} calls</span>
                          <span>{customer.openTickets} open</span>
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                No customers found.
              </div>
            )}
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Selected data
              </p>
              <h2 className="mt-1 truncate text-lg font-bold text-slate-950 dark:text-white">
                {selectedOption?.name ?? "No customer selected"}
              </h2>
              <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">
                {selectedOption
                  ? `${selectedOption.phone} · ${formatLastContact(selectedOption.lastContactAt)}`
                  : "Select a customer to load a real profile."}
              </p>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                Direction
              </label>
              <Select
                value={direction}
                onValueChange={(value) => {
                  setDirection(value as CallDirection);
                  resetCall("RINGING");
                }}
              >
                <SelectTrigger className="mt-1 h-9 w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INBOUND">
                    <PhoneIncoming className="h-4 w-4" />
                    Inbound
                  </SelectItem>
                  <SelectItem value="OUTBOUND">
                    <PhoneOutgoing className="h-4 w-4" />
                    Outbound
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                State
              </label>
              <div className="mt-1 flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
                {stateOptions.map((option) => {
                  const Icon = option.icon;
                  const active = callState === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleStateChange(option.value)}
                      className={cn(
                        "flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors",
                        active
                          ? "bg-white text-[#008f68] shadow-sm dark:bg-slate-950 dark:text-emerald-300"
                          : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="relative min-h-[680px] overflow-hidden rounded-xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(0,143,104,0.08),transparent_34%),linear-gradient(180deg,#ffffff,#f8fafc)] p-4 shadow-sm dark:border-slate-800 dark:bg-none dark:bg-slate-950">
            {profileLoading ? (
              <div className="flex h-[620px] items-center justify-center">
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  <RefreshCw className="h-4 w-4 animate-spin text-[#008f68]" />
                  Loading real customer profile
                </div>
              </div>
            ) : profileError ? (
              <div className="flex h-[620px] items-center justify-center">
                <div className="max-w-md rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="h-4 w-4" />
                    Profile failed to load
                  </div>
                  <p className="mt-1">{profileError}</p>
                </div>
              </div>
            ) : profile ? (
              <IncomingCallModal
                open
                onOpenChange={() => undefined}
                customer={profile}
                call={call}
                persistent
                draggable={false}
                position="inline"
              />
            ) : (
              <div className="flex h-[620px] items-center justify-center text-sm font-medium text-slate-500">
                Select a customer to preview the incoming call modal.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
