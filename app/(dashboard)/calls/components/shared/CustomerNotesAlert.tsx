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

function NotesPopoverContent({ notes }: { notes: CustomerNote[] }) {
  return (
    <PopoverContent
      align="start"
      sideOffset={8}
      className="z-50 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-amber-100 bg-white p-0 shadow-lg"
    >
      <div className="flex items-center gap-2 border-b border-amber-100/80 bg-amber-50/60 px-3.5 py-2.5">
        <StickyNote className="size-3.5 text-amber-500" aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700">
          Customer Notes
        </p>
        <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-800">
          {notes.length}
        </span>
      </div>
      <div className="max-h-72 space-y-1.5 overflow-y-auto p-2 scrollbar-app">
        {notes.map((note, index) => {
          const dateLabel = formatNoteDate(note.createdAt);
          const meta = [note.createdBy, dateLabel].filter(Boolean).join(" · ");

          return (
            <div
              key={note.id ?? index}
              className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
            >
              <p className="whitespace-pre-wrap break-words text-[12px] leading-5 text-slate-800">
                {note.content}
              </p>
              {meta ? (
                <p className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-slate-400">
                  <CalendarIcon className="size-3" aria-hidden />
                  {meta}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </PopoverContent>
  );
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

  /* ── Inline pill (used inside drawer header rows) ── */
  if (inline) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "group flex w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-lg border border-amber-200/60 bg-amber-50/70 px-2 py-1 text-left transition-colors hover:border-amber-300/80 hover:bg-amber-100/50 focus:outline-none focus:ring-1 focus:ring-amber-300/40",
              className,
            )}
          >
            <StickyNote
              className="size-3 shrink-0 text-amber-500/80"
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-none text-amber-800">
              {firstNote}
            </span>
            {notes.length > 1 && (
              <span className="shrink-0 rounded-full bg-amber-200/70 px-1 text-[9px] font-semibold leading-4 text-amber-900">
                +{notes.length - 1}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <NotesPopoverContent notes={notes} />
      </Popover>
    );
  }

  /* ── Block variant (compact or full) ── */
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "group relative w-full overflow-hidden rounded-lg border border-amber-200/60 bg-amber-50/70 text-left transition-colors hover:border-amber-300/80 hover:bg-amber-100/50 focus:outline-none focus:ring-1 focus:ring-amber-300/40",
            compact ? "px-3 py-1.5" : "px-3.5 py-2.5",
            className,
          )}
        >
          <span
            className="absolute inset-y-0 left-0 w-0.5 rounded-r-full bg-amber-400/60"
            aria-hidden
          />
          <span className="flex min-w-0 items-center gap-2 pl-2.5">
            <StickyNote
              className={cn(
                "shrink-0 text-amber-500/80",
                compact ? "size-3.5" : "size-4",
              )}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-700/80">
                  Note
                </span>
                {notes.length > 1 && (
                  <span className="rounded-full bg-amber-200/70 px-1.5 py-px text-[9px] font-semibold leading-none text-amber-800">
                    {notes.length}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "block text-[11px] font-medium leading-4 text-amber-950",
                  compact ? "mt-0.5 line-clamp-1" : "mt-1 line-clamp-2",
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
        className="z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-amber-200 bg-white dark:bg-neutral-900 p-0 shadow-xl"
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
                className="rounded-xl border border-slate-100 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/50 px-3 py-2.5"
              >
                <p className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-800 dark:text-neutral-200">
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
