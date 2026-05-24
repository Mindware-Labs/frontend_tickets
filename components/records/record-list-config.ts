import type { UnifiedRecordType } from "./types";

export type RecordListConfig = {
  unit: string;
  unitSingular: string;
  groupColumnHeader: string;
  showPriority: boolean;
};

export const RECORD_LIST_CONFIG: Record<UnifiedRecordType, RecordListConfig> = {
  call: {
    unit: "calls",
    unitSingular: "call",
    groupColumnHeader: "Calls",
    showPriority: false,
  },
  ticket: {
    unit: "tickets",
    unitSingular: "ticket",
    groupColumnHeader: "Tickets",
    showPriority: true,
  },
  manual_record: {
    unit: "manual",
    unitSingular: "manual",
    groupColumnHeader: "Manual",
    showPriority: true,
  },
};

export function formatGroupTotal(
  count: number,
  singular: string,
  plural: string,
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function formatGroupPosition(
  index: number,
  total: number,
  singular: string,
  plural: string,
) {
  const label = total === 1 ? singular : plural;
  return `${index} of ${total} ${label}`;
}
