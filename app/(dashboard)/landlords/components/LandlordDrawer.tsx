"use client";

import { useState } from "react";
import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Phone, Mail, Copy, Check, Building, ArrowUpRight, FileText,
} from "lucide-react";
import { Landlord, YardOption } from "../types";
import { useRole } from "@/components/providers/role-provider";

interface LandlordDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  landlord: Landlord | null;
  yards: YardOption[];
}

function getYards(landlord: Landlord | null, yards: YardOption[]): YardOption[] {
  if (!landlord) return [];
  if (landlord.yards && landlord.yards.length > 0) return landlord.yards;
  return yards.filter((y) => y.landlord?.id === landlord.id);
}

export function LandlordDrawer({ open, onOpenChange, landlord, yards }: LandlordDrawerProps) {
  const { role } = useRole();
  const isAgent = role?.toString().toLowerCase() === "agent";
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!landlord) return null;

  const initials = landlord.name
    ? landlord.name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()
    : "?";

  const linkedYards = getYards(landlord, yards);

  const handleCopyPhone = () => {
    if (!landlord.phone) return;
    navigator.clipboard.writeText(landlord.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyEmail = () => {
    if (!landlord.email) return;
    navigator.clipboard.writeText(landlord.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md p-0 flex flex-col">

        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarFallback className="bg-[#e2fae9] text-[#008f68] font-bold text-sm dark:bg-[#008f68]/10 dark:text-emerald-400">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base font-semibold text-slate-900 leading-tight truncate">
                {landlord.name || "Unknown Landlord"}
              </SheetTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                {linkedYards.length} yard{linkedYards.length !== 1 ? "s" : ""} linked
              </p>
            </div>
            {linkedYards.length > 0 && (
              <Badge className="bg-[#e2fae9] text-[#008f68] border border-[#bbf7d0] text-[11px] font-medium shrink-0 dark:bg-[#008f68]/10 dark:border-[#008f68]/30 dark:text-emerald-400">
                {linkedYards.length} yards
              </Badge>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-5 py-4 space-y-5">

            {/* Contact info */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Contact</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-200">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-sm font-medium font-mono">{landlord.phone || "—"}</span>
                </div>
                {landlord.phone && (
                  <button onClick={handleCopyPhone} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors">
                    {copiedPhone
                      ? <Check className="h-3.5 w-3.5 text-green-600" />
                      : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-700 dark:text-neutral-200">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="text-sm font-medium truncate">{landlord.email || "—"}</span>
                </div>
                {landlord.email && (
                  <button onClick={handleCopyEmail} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors">
                    {copiedEmail
                      ? <Check className="h-3.5 w-3.5 text-green-600" />
                      : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                  </button>
                )}
              </div>
            </div>

            <Separator />

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-50 rounded-lg border border-slate-200/60 p-3 text-center dark:bg-neutral-900 dark:border-neutral-700">
                <Building className="h-4 w-4 text-slate-400 mx-auto mb-1" />
                <p className="text-[15px] font-semibold text-slate-900 leading-none dark:text-neutral-100">{linkedYards.length}</p>
                <p className="text-[10px] text-slate-500 mt-1 dark:text-neutral-400">Yards</p>
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-200/60 p-3 text-center dark:bg-neutral-900 dark:border-neutral-700">
                <FileText className="h-4 w-4 text-slate-400 mx-auto mb-1" />
                <p className="text-[15px] font-semibold text-slate-900 leading-none dark:text-neutral-100">#{landlord.id}</p>
                <p className="text-[10px] text-slate-500 mt-1 dark:text-neutral-400">Landlord ID</p>
              </div>
            </div>



            <Separator />

            {/* Yards */}
            <div className="space-y-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Associated Yards</p>

              {linkedYards.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">No yards linked.</p>
              ) : (
                <div className="space-y-2">
                  {linkedYards.map((yard) => (
                    <Link
                      key={yard.id}
                      href={yard.id ? `/yards?yardId=${yard.id}` : "/yards"}
                      onClick={() => onOpenChange(false)}
                      className="group flex items-center gap-3 p-3 rounded-lg border border-slate-200/60 bg-slate-50 hover:border-[#008f68]/40 hover:bg-[#f0fdf8] transition-colors dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-[#008f68]/40 dark:hover:bg-[#008f68]/10"
                    >
                      <div className="h-8 w-8 rounded-md bg-[#e2fae9] flex items-center justify-center shrink-0">
                        <Building className="h-4 w-4 text-[#008f68]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate leading-none text-slate-800 dark:text-neutral-100">
                          {yard.name}
                        </p>
                        {yard.commonName && (
                          <p className="text-[11px] text-slate-400 mt-0.5 truncate">{yard.commonName}</p>
                        )}
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
