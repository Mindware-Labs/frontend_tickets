"use client";

import { SelectItem } from "@/components/ui/select";
import { FollowUpDateTimePicker } from "../calls/FollowUpDateTimePicker";
import { InspectorSelect } from "../shared/InspectorHelpers";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-400">
      {children}
    </p>
  );
}

export interface TicketFollowUpFieldsProps {
  followUpDueDate: string;
  followUpAssignedToId: string;
  onFollowUpDueDateChange: (iso: string) => void;
  onFollowUpAssignedToIdChange: (id: string) => void;
  agents: { id: number; name: string }[];
  /** Extra classes for portaled overlays (e.g. z-[120] in peek panel) */
  popoverClassName?: string;
  selectContentClassName?: string;
}

export function TicketFollowUpFields({
  followUpDueDate,
  followUpAssignedToId,
  onFollowUpDueDateChange,
  onFollowUpAssignedToIdChange,
  agents,
  popoverClassName,
  selectContentClassName,
}: TicketFollowUpFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 shadow-sm sm:grid-cols-2">
      <div className="min-w-0">
        <div className="mb-1.5 flex h-4 min-w-0 items-center gap-1.5">
          <FieldLabel>Follow-up Date</FieldLabel>
          <span className="ml-auto shrink-0 rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 text-[8px] font-black uppercase leading-none tracking-wide text-[#008f68] dark:text-emerald-400">
            Follow-up
          </span>
        </div>
        <FollowUpDateTimePicker
          value={followUpDueDate ? new Date(followUpDueDate).toISOString() : ""}
          onChange={onFollowUpDueDateChange}
          placeholder="Pick date..."
          className="h-8 border-slate-200/80 text-xs shadow-none"
          popoverClassName={popoverClassName}
        />
      </div>

      <div className="min-w-0">
        <FieldLabel>Assignee</FieldLabel>
        <InspectorSelect
          value={followUpAssignedToId || ""}
          onChange={(v) =>
            onFollowUpAssignedToIdChange(v === "none" ? "" : v)
          }
          placeholder="Assign..."
          contentClassName={selectContentClassName}
        >
          <SelectItem value="none">Unassigned</SelectItem>
          {agents.map((a) => (
            <SelectItem key={a.id} value={a.id.toString()}>
              {a.name}
            </SelectItem>
          ))}
        </InspectorSelect>
      </div>
    </div>
  );
}
