"use client";

import { AlertTriangle, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { EntityLoadingSpinner } from "@/components/shared/entity-loading-state";
import {
  avatarHueFromString,
  conversationAgentLabel,
  formatRelativeShort,
  getInitials,
  getMessageDate,
} from "./sms-helpers";
import { type SmsConversation } from "./sms-types";

interface SmsConversationListProps {
  conversations: SmsConversation[];
  selectedKey: string | null;
  onSelect: (conversation: SmsConversation) => void;
  loading?: boolean;
  now?: number;
  /** Optional helper text shown when the filtered list is empty. */
  emptyHint?: string;
}

const RECENT_MS = 60 * 60 * 1000; // 1 hour

export function SmsConversationList({
  conversations,
  selectedKey,
  onSelect,
  loading = false,
  now = Date.now(),
  emptyHint = "Adjust the period or clear filters to see SMS activity here.",
}: SmsConversationListProps) {
  if (loading && conversations.length === 0) {
    return (
      <div className="flex h-full min-h-[240px] flex-col items-center justify-center bg-[#f7f8fa] dark:bg-slate-950/60">
        <EntityLoadingSpinner kind="sms" size="md" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-500">
          <MessagesSquare className="size-5" aria-hidden />
        </span>
        <p className="text-[13px] font-semibold text-slate-700 dark:text-slate-200">
          No conversations
        </p>
        <p className="max-w-[240px] text-[11.5px] text-slate-500 dark:text-slate-400">
          {emptyHint}
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {conversations.map((convo) => (
        <ConversationRow
          key={convo.key}
          convo={convo}
          selected={selectedKey === convo.key}
          onSelect={() => onSelect(convo)}
          now={now}
        />
      ))}
    </ul>
  );
}

function ConversationRow({
  convo,
  selected,
  onSelect,
  now,
}: {
  convo: SmsConversation;
  selected: boolean;
  onSelect: () => void;
  now: number;
}) {
  const lastDate = getMessageDate(convo.lastMessage);
  const lastBody =
    convo.lastMessage.body?.trim() ||
    (convo.lastMessage.mediaUrls?.length
      ? "[Media attachment]"
      : "[Empty message]");
  const lastDirection = convo.lastMessage.direction;
  const preview =
    lastDirection === "SENT" ? `You: ${lastBody}` : lastBody;
  const hue = avatarHueFromString(convo.displayName);
  const initials = getInitials(convo.displayName);
  const hasFailures = convo.failedCount > 0;
  const isRecent = now - convo.lastTimestamp < RECENT_MS;
  // "Pending reply" — last message is RECEIVED, treated as the audit-equivalent
  // of an unread thread.
  const pendingReply = lastDirection === "RECEIVED";

  return (
    <li className="border-b border-slate-100 last:border-b-0 dark:border-slate-800/80">
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "group/convo relative flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
          "hover:bg-slate-50 dark:hover:bg-slate-900/60",
          selected &&
            "bg-[#f0faf5] hover:bg-[#f0faf5] dark:bg-emerald-500/10 dark:hover:bg-emerald-500/10",
        )}
        aria-current={selected ? "true" : undefined}
      >
        <span
          className={cn(
            "absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-[#008f68] to-[#006b4f] transition-opacity",
            selected ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        />

        <span className="relative shrink-0">
          <span
            aria-hidden
            className="inline-flex size-10 items-center justify-center rounded-full text-[12px] font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] ring-1 ring-black/5 dark:ring-white/10"
            style={{
              background: `linear-gradient(135deg, hsl(${hue} 55% 44%), hsl(${(hue + 28) % 360} 60% 32%))`,
            }}
          >
            {initials}
          </span>
          {isRecent && !hasFailures && (
            <span
              aria-label="Active in the last hour"
              title="Active in the last hour"
              className="absolute bottom-0 right-0 inline-flex size-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_2px_white,0_0_0_4px_rgba(16,185,129,0.18)] dark:shadow-[0_0_0_2px_rgb(2_6_23),0_0_0_4px_rgba(16,185,129,0.25)]"
            />
          )}
          {hasFailures && (
            <span
              aria-label={`${convo.failedCount} failed message${convo.failedCount === 1 ? "" : "s"}`}
              title={`${convo.failedCount} failed message${convo.failedCount === 1 ? "" : "s"}`}
              className="absolute -bottom-0.5 -right-0.5 inline-flex size-3.5 items-center justify-center rounded-full bg-rose-500 text-white ring-2 ring-white dark:ring-slate-950"
            >
              <AlertTriangle className="size-2" strokeWidth={2.5} />
            </span>
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                "truncate text-[13px] font-semibold leading-tight text-slate-900 dark:text-slate-100",
                selected && "text-[#006b4f] dark:text-emerald-300",
              )}
            >
              {convo.displayName}
            </p>
            <span
              className={cn(
                "shrink-0 text-[10.5px] font-medium tabular-nums",
                pendingReply && !selected
                  ? "text-[#006b4f] dark:text-emerald-300"
                  : "text-slate-400 dark:text-slate-500",
              )}
            >
              {formatRelativeShort(lastDate, now)}
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-2">
            <p
              className={cn(
                "line-clamp-1 flex-1 text-[11.5px] leading-snug",
                pendingReply && !selected
                  ? "font-semibold text-slate-700 dark:text-slate-200"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              {preview}
            </p>
            {pendingReply && convo.inboundCount > 0 ? (
              <span
                aria-label={`${convo.inboundCount} inbound message${convo.inboundCount === 1 ? "" : "s"}`}
                className="ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-[#008f68] to-[#006b4f] px-1.5 text-[10px] font-bold leading-none text-white shadow-sm shadow-emerald-500/20"
              >
                {convo.inboundCount > 99 ? "99+" : convo.inboundCount}
              </span>
            ) : hasFailures ? (
              <span
                aria-label={`${convo.failedCount} failed`}
                className="ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold leading-none text-white shadow-sm"
              >
                {convo.failedCount > 99 ? "99+" : convo.failedCount}
              </span>
            ) : null}
          </div>

          <div className="mt-1 flex min-w-0 items-center gap-1.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#008f68]/70" />
            <span
              className={cn(
                "truncate text-[10.5px] font-semibold",
                convo.agents.length === 0
                  ? "text-slate-400 dark:text-slate-500"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              Agent: {conversationAgentLabel(convo)}
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}
