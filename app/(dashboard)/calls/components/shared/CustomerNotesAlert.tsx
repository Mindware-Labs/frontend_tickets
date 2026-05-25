"use client";

import { CalendarIcon, StickyNote } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type CustomerNote = {
  id?: number | string;
  content?: string | null;
  createdAt?: string | null;
  createdBy?: string | null;
};

type CustomerNotesAlertProps = {
  customer: unknown;
  className?: string;
  compact?: boolean;
  inline?: boolean;
};

function normalizeCustomerNotes(customer: unknown): CustomerNote[] {
  const source =
    customer && typeof customer === "object"
      ? (customer as { note?: unknown; notes?: unknown })
      : null;

  const structured = (Array.isArray(source?.notes) ? source.notes : [])
    .map((rawNote) => {
      const note =
        rawNote && typeof rawNote === "object"
          ? (rawNote as Record<string, unknown>)
          : {};
      const content =
        typeof note.content === "string" ? note.content.trim() : "";

      return {
        id:
          typeof note.id === "string" || typeof note.id === "number"
            ? note.id
            : undefined,
        content,
        createdAt:
          typeof note.createdAt === "string" ? note.createdAt : undefined,
        createdBy:
          typeof note.createdBy === "string" ? note.createdBy : undefined,
      };
    })
    .filter((note) => note.content);

  if (structured.length > 0) return structured;

  const legacyNote = typeof source?.note === "string" ? source.note.trim() : "";
  return legacyNote ? [{ id: "legacy", content: legacyNote }] : [];
}

function formatNoteDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function CustomerNotesAlert({
  customer,
  className,
  compact = false,
  inline = false,
}: CustomerNotesAlertProps) {
  const notes = normalizeCustomerNotes(customer);
  if (notes.length === 0) return null;

  const firstNote = notes[0]?.content || "";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group relative w-full overflow-hidden rounded-xl border border-amber-300/80 bg-amber-50 text-left shadow-[0_1px_3px_rgba(0,0,0,0.08)] ring-1 ring-amber-200/40 transition-colors hover:border-amber-400 hover:bg-amber-100/75 focus:outline-none focus:ring-2 focus:ring-amber-400/35",
            inline
              ? "px-2.5 py-1.5"
              : compact
                ? "px-3 py-2"
                : "px-3.5 py-3",
            className,
          )}
        >
          <span
            className="absolute inset-y-0 left-0 w-1 bg-amber-500"
            aria-hidden
          />
          <span
            className={cn(
              "flex min-w-0 pl-1.5",
              inline ? "items-center gap-2" : "items-start gap-2.5",
            )}
          >
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 ring-1 ring-amber-200/80",
                inline ? "size-7" : "mt-0.5 size-8",
              )}
            >
              <StickyNote
                className={cn(inline ? "size-3.5" : "size-4")}
                aria-hidden
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800">
                  Customer note
                </span>
                <span className="rounded-full bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-amber-900">
                  {notes.length}
                </span>
                <span className="text-[10px] font-semibold text-amber-700/80">
                  Click to view
                </span>
              </span>
              <span
                className={cn(
                  "block text-xs font-medium text-amber-950",
                  inline ? "mt-0.5 leading-4" : "mt-1 leading-5",
                  compact ? "line-clamp-1" : "line-clamp-2",
                )}
              >
                {firstNote}
              </span>
            </span>
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-amber-200 bg-white p-0 shadow-xl"
      >
        <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-4 py-3">
          <StickyNote className="size-4 text-amber-600" aria-hidden />
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-800">
            Customer Notes
          </p>
          <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-200">
            {notes.length}
          </span>
        </div>
        <div className="max-h-80 space-y-2 overflow-y-auto p-2 scrollbar-app">
          {notes.map((note, index) => {
            const dateLabel = formatNoteDate(note.createdAt);
            const meta = [note.createdBy, dateLabel].filter(Boolean).join(" - ");

            return (
              <div
                key={note.id ?? index}
                className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
              >
                <p className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-800">
                  {note.content}
                </p>
                {meta ? (
                  <p className="mt-2 flex items-center gap-1 text-[10px] font-medium text-slate-400">
                    <CalendarIcon className="size-3" aria-hidden />
                    {meta}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
