"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCheck,
  Clock,
  Copy,
  Hash,
  Image as ImageIcon,
  Megaphone,
  MessagesSquare,
  Paperclip,
  Phone,
  Send,
  Smile,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  avatarHueFromString,
  classifySmsStatus,
  dayKey,
  dayLabel,
  formatPhone,
  formatTimeShort,
  getInitials,
  getMessageDate,
  statusBucketLabel,
} from "./sms-helpers";
import {
  type SmsConversation,
  type SmsMessageRecord,
  type SmsStatusBucket,
} from "./sms-types";

interface SmsChatPaneProps {
  conversation: SmsConversation | null;
  now?: number;
}

interface ChatGroup {
  key: string;
  label: string;
  messages: SmsMessageRecord[];
}

const RECENT_MS = 60 * 60 * 1000; // 1h "online" heuristic for audit context

export function SmsChatPane({ conversation, now = Date.now() }: SmsChatPaneProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const groups: ChatGroup[] = useMemo(() => {
    if (!conversation) return [];
    const buckets = new Map<string, ChatGroup>();
    for (const message of conversation.messages) {
      const date = getMessageDate(message);
      const key = dayKey(date);
      let group = buckets.get(key);
      if (!group) {
        group = { key, label: dayLabel(date), messages: [] };
        buckets.set(key, group);
      }
      group.messages.push(message);
    }
    return Array.from(buckets.values()).sort((a, b) =>
      a.key.localeCompare(b.key),
    );
  }, [conversation]);

  // Auto-scroll to bottom when the conversation changes (instant) or when new
  // messages are appended (smooth).
  const lastTimestampRef = useRef<number | null>(null);
  useEffect(() => {
    if (!conversation || !scrollRef.current) {
      lastTimestampRef.current = null;
      return;
    }
    const el = scrollRef.current;
    const last = conversation.lastTimestamp;
    const isNewConvo = lastTimestampRef.current !== last;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: isNewConvo ? "auto" : "smooth",
    });
    lastTimestampRef.current = last;
  }, [conversation]);

  if (!conversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <span
          aria-hidden
          className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#f0faf5] text-[#008f68] ring-1 ring-[#008f68]/15 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30"
        >
          <MessagesSquare className="size-5" aria-hidden strokeWidth={2} />
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          SMS audit
        </p>
        <p className="text-[14px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Select a conversation
        </p>
        <p className="max-w-[320px] text-[12px] leading-relaxed text-slate-500 dark:text-slate-400">
          Pick a conversation from the list to inspect every inbound and
          outbound SMS, including delivery status, agent attribution, and
          campaign context.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatHeader conversation={conversation} now={now} />

      <div
        ref={scrollRef}
        className="relative flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/70 via-white to-slate-50/70 px-3 py-4 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950 sm:px-5 sm:py-5"
      >
        {/* Subtle dot pattern reminiscent of native messengers */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle,rgba(15,23,42,0.035)_1px,transparent_1px)] [background-size:18px_18px] dark:[background-image:radial-gradient(circle,rgba(255,255,255,0.04)_1px,transparent_1px)]"
        />
        <div className="relative flex flex-col gap-3">
          {groups.map((group) => (
            <ChatDayGroup
              key={group.key}
              group={group}
              conversation={conversation}
            />
          ))}
        </div>
      </div>

      <ChatCompose />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Header
// ────────────────────────────────────────────────────────────────────────
function ChatHeader({
  conversation,
  now,
}: {
  conversation: SmsConversation;
  now: number;
}) {
  const [copied, setCopied] = useState(false);
  const subtitle =
    conversation.customer?.phone || conversation.externalNumber || "";
  const phonePretty = subtitle ? formatPhone(subtitle) : "";
  const hue = avatarHueFromString(conversation.displayName);
  const initials = getInitials(conversation.displayName);
  const isRecent = now - conversation.lastTimestamp < RECENT_MS;
  const recencyLabel = isRecent
    ? "Active in the last hour"
    : "No recent activity";
  const lastBucket = classifySmsStatus(conversation.lastMessage);

  const handleCopySummary = async () => {
    const lines = [
      `SMS thread: ${conversation.displayName}`,
      phonePretty ? `Phone: ${phonePretty}` : null,
      `Messages: ${conversation.totalCount} (${conversation.inboundCount} inbound / ${conversation.outboundCount} outbound)`,
      `Failed: ${conversation.failedCount}`,
      `Last status: ${statusBucketLabel(lastBucket)}`,
      conversation.lastMessage.aircallConversationId
        ? `Aircall conversation: ${conversation.lastMessage.aircallConversationId}`
        : null,
    ].filter(Boolean);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative shrink-0 border-b border-slate-200/80 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950 sm:px-5">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
      />

      <div className="flex items-center gap-3">
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
          {isRecent && (
            <span
              aria-label={recencyLabel}
              title={recencyLabel}
              className="absolute bottom-0 right-0 inline-flex size-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_2px_white,0_0_0_4px_rgba(16,185,129,0.22)] dark:shadow-[0_0_0_2px_rgb(2_6_23),0_0_0_4px_rgba(16,185,129,0.3)]"
            />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            SMS thread
          </p>
          <p className="truncate text-[14px] font-bold leading-tight text-slate-900 dark:text-slate-100">
            {conversation.displayName}
          </p>
          {phonePretty && (
            <p className="truncate text-[11.5px] font-medium tabular-nums text-slate-500 dark:text-slate-400">
              {phonePretty}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopySummary}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 shadow-sm transition-colors hover:border-[#008f68]/30 hover:bg-[#f0faf5] hover:text-[#006b4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
        >
          <Copy className="size-3" aria-hidden />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-[52px]">
        <ContextChip icon={MessagesSquare} label={`${conversation.totalCount} messages`} tone="slate" />
        <ContextChip icon={Clock} label={recencyLabel} tone={isRecent ? "emerald" : "slate"} />
        {conversation.failedCount > 0 && (
          <ContextChip icon={AlertCircle} label={`${conversation.failedCount} failed`} tone="rose" />
        )}
        {conversation.phoneLine?.name && (
          <ContextChip icon={Phone} label={conversation.phoneLine.name} tone="emerald" />
        )}
        {conversation.campaigns.slice(0, 1).map((campaign) => (
          <ContextChip
            key={campaign.id}
            icon={Megaphone}
            label={campaign.nombre || `Campaign #${campaign.id}`}
            tone="violet"
          />
        ))}
        {conversation.campaigns.length > 1 && (
          <ContextChip icon={Hash} label={`+${conversation.campaigns.length - 1}`} tone="slate" />
        )}
      </div>
    </div>
  );
}

const CONTEXT_CHIP_TONES = {
  emerald:
    "border-[#008f68]/20 bg-[#f0faf5] text-[#006b4f] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
  violet:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300",
  rose:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300",
  slate:
    "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
} as const;

function ContextChip({
  icon: Icon,
  label,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  tone: keyof typeof CONTEXT_CHIP_TONES;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold",
        CONTEXT_CHIP_TONES[tone],
      )}
    >
      <Icon className="size-3" aria-hidden strokeWidth={2.25} />
      <span className="max-w-[140px] truncate">{label}</span>
    </span>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Day groups
// ────────────────────────────────────────────────────────────────────────
function ChatDayGroup({
  group,
  conversation,
}: {
  group: ChatGroup;
  conversation: SmsConversation;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <DateDivider label={group.label} />
      <div className="flex flex-col gap-1">
        {group.messages.map((message, idx) => {
          const prev = group.messages[idx - 1];
          const isOutbound = message.direction === "SENT";
          // Render the avatar only on the first inbound bubble of a run, like
          // native messengers.
          const showAvatar =
            !isOutbound && (!prev || prev.direction === "SENT");
          // Tighten the gap between consecutive bubbles from the same side so
          // they read as a connected message run.
          const isSameRun = !!prev && prev.direction === message.direction;
          return (
            <ChatBubble
              key={message.id}
              message={message}
              conversation={conversation}
              showAvatar={showAvatar}
              isSameRun={isSameRun}
            />
          );
        })}
      </div>
    </div>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-slate-800"
      />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span
        aria-hidden
        className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 to-transparent dark:via-slate-800"
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Single bubble
// ────────────────────────────────────────────────────────────────────────
function ChatBubble({
  message,
  conversation,
  showAvatar,
  isSameRun,
}: {
  message: SmsMessageRecord;
  conversation: SmsConversation;
  showAvatar: boolean;
  isSameRun: boolean;
}) {
  const isOutbound = message.direction === "SENT";
  const date = getMessageDate(message);
  const time = formatTimeShort(date);
  const bucket = classifySmsStatus(message);
  const body = message.body?.trim() || "";
  const hasMedia = !!message.mediaUrls?.length;
  const isFailed = bucket === "failed";

  if (isOutbound) {
    return (
      <div
        className={cn(
          "ml-auto flex w-full max-w-[85%] items-end justify-end gap-2 sm:max-w-[75%]",
          isSameRun ? "mt-0.5" : "mt-1.5",
        )}
      >
        <div
          className={cn(
            "relative max-w-full rounded-2xl rounded-br-md px-3.5 py-2 shadow-[0_1px_2px_rgba(0,143,104,0.18)]",
            isFailed
              ? "bg-rose-50 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/30"
              : "bg-gradient-to-br from-[#008f68] to-[#006b4f]",
          )}
        >
          {body ? (
            <p
              className={cn(
                "whitespace-pre-wrap break-words text-[13px] leading-relaxed",
                isFailed
                  ? "text-rose-700 dark:text-rose-200"
                  : "text-white",
              )}
            >
              {body}
            </p>
          ) : hasMedia ? (
            <p
              className={cn(
                "text-[13px] italic",
                isFailed ? "text-rose-700/80" : "text-white/80",
              )}
            >
              [Media-only message]
            </p>
          ) : (
            <p
              className={cn(
                "text-[13px] italic",
                isFailed ? "text-rose-700/70" : "text-white/60",
              )}
            >
              [Empty message]
            </p>
          )}

          {hasMedia && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {message.mediaUrls!.map((url, idx) => (
                <a
                  key={`${message.id}-media-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    isFailed
                      ? "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-200"
                      : "bg-white/15 text-white hover:bg-white/25",
                  )}
                >
                  <ImageIcon className="size-3" aria-hidden />
                  Media {idx + 1}
                </a>
              ))}
            </div>
          )}

          <div
            className={cn(
              "mt-1 flex items-center justify-end gap-1 text-[10px] font-medium tabular-nums",
              isFailed ? "text-rose-600/80 dark:text-rose-300/80" : "text-white/85",
            )}
          >
            <time>{time}</time>
            <BubbleStatusIcon bucket={bucket} />
          </div>
        </div>
      </div>
    );
  }

  // Inbound bubble — white card with avatar shown on the first bubble of a run.
  const hue = avatarHueFromString(conversation.displayName);
  const initials = getInitials(conversation.displayName);

  return (
    <div
      className={cn(
        "flex w-full max-w-[85%] items-end gap-2 sm:max-w-[75%]",
        isSameRun ? "mt-0.5" : "mt-1.5",
      )}
    >
      {showAvatar ? (
        <span
          aria-hidden
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 55% 44%), hsl(${(hue + 28) % 360} 60% 32%))`,
          }}
        >
          {initials}
        </span>
      ) : (
        <span aria-hidden className="size-7 shrink-0" />
      )}

      <div className="relative max-w-full rounded-2xl rounded-bl-md bg-white px-3.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        {body ? (
          <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-slate-800 dark:text-slate-100">
            {body}
          </p>
        ) : hasMedia ? (
          <p className="text-[13px] italic text-slate-400">
            [Media-only message]
          </p>
        ) : (
          <p className="text-[13px] italic text-slate-400">[Empty message]</p>
        )}

        {hasMedia && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {message.mediaUrls!.map((url, idx) => (
              <a
                key={`${message.id}-media-${idx}`}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              >
                <ImageIcon className="size-3" aria-hidden />
                Media {idx + 1}
              </a>
            ))}
          </div>
        )}

        <div className="mt-1 flex items-center justify-start gap-1 text-[10px] font-medium tabular-nums text-slate-400 dark:text-slate-500">
          <time>{time}</time>
        </div>
      </div>
    </div>
  );
}

const STATUS_ICONS: Partial<Record<SmsStatusBucket, LucideIcon>> = {
  delivered: CheckCheck,
  sent: Check,
  queued: Clock,
  failed: AlertCircle,
};

function BubbleStatusIcon({ bucket }: { bucket: SmsStatusBucket }) {
  const Icon = STATUS_ICONS[bucket];
  if (!Icon) return null;
  return <Icon className="size-3" aria-hidden strokeWidth={2.5} />;
}

// ────────────────────────────────────────────────────────────────────────
// Compose (read-only audit view)
// ────────────────────────────────────────────────────────────────────────
function ChatCompose() {
  return (
    <div className="border-t border-slate-200/80 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950 sm:px-4">
      <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-1 dark:border-slate-800 dark:bg-slate-900/70">
        <button
          type="button"
          disabled
          aria-label="Attach file (disabled — read-only audit)"
          title="Read-only audit view"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Paperclip className="size-3.5" aria-hidden />
        </button>
        <input
          type="text"
          disabled
          readOnly
          value=""
          placeholder="Read-only audit view — sending disabled"
          className="flex-1 cursor-not-allowed bg-transparent px-1 text-[12.5px] text-slate-700 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed dark:text-slate-200 dark:placeholder:text-slate-500"
          aria-label="Compose message"
        />
        <button
          type="button"
          disabled
          aria-label="Insert emoji (disabled)"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Smile className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          disabled
          aria-label="Send message (disabled)"
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-300 text-white shadow-sm transition-all disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-700"
        >
          <Send className="size-3.5" aria-hidden strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
