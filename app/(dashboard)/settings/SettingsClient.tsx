"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Inbox,
  Loader2,
  Megaphone,
  Pencil,
  Phone,
  Plus,
  Search,
  TicketIcon,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useConfigurations } from "@/hooks/useConfigurations";
import { toast } from "@/hooks/use-toast";
import {
  createDisposition,
  updateDisposition,
  deleteDisposition,
  createTicketType,
  updateTicketType,
  deleteTicketType,
  createCampaignType,
  updateCampaignType,
  deleteCampaignType,
  createCampaignOption,
  updateCampaignOption,
  deleteCampaignOption,
  type DispositionConfig,
  type TicketTypeConfig,
  type CampaignTypeConfig,
  type CampaignOptionConfig,
} from "@/lib/configurations-api";
import { ConfigItemModal } from "./ConfigItemModal";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";

const SECTIONS = [
  {
    key: "dispositions" as const,
    label: "Call Dispositions",
    shortLabel: "Dispositions",
    description: "Outcomes agents select when logging a call",
    addLabel: "Add disposition",
    icon: Phone,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-50 dark:bg-sky-950/40",
  },
  {
    key: "ticketTypes" as const,
    label: "Ticket Types",
    shortLabel: "Ticket Types",
    description: "Classifications available when creating or updating a ticket",
    addLabel: "Add type",
    icon: TicketIcon,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-950/40",
  },
  {
    key: "campaignTypes" as const,
    label: "Campaign Types & Options",
    shortLabel: "Campaigns",
    description: "Campaign categories, each with their own outcome options",
    addLabel: "Add campaign type",
    icon: Megaphone,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
  },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

type EditTarget =
  | { kind: "disposition"; item?: DispositionConfig }
  | { kind: "ticketType"; item?: TicketTypeConfig }
  | { kind: "campaignType"; item?: CampaignTypeConfig }
  | {
      kind: "campaignOption";
      campaignTypeId: number;
      item?: CampaignOptionConfig;
    };

type DeleteTarget =
  | { kind: "disposition"; item: DispositionConfig }
  | { kind: "ticketType"; item: TicketTypeConfig }
  | { kind: "campaignType"; item: CampaignTypeConfig }
  | { kind: "campaignOption"; item: CampaignOptionConfig };

export function SettingsClient() {
  const [activeSection, setActiveSection] =
    useState<SectionKey>("dispositions");
  const [query, setQuery] = useState("");
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set());
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    dispositions,
    ticketTypes,
    campaignTypes,
    loading,
    setDispositions,
    setTicketTypes,
    setCampaignTypes,
  } = useConfigurations(false);

  const toggleExpanded = (id: number) => {
    setExpandedTypes((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectSection = (key: SectionKey) => {
    setActiveSection(key);
    setQuery("");
  };

  // ── Toggle active ──────────────────────────────────────────────────────────

  const handleToggleDisposition = async (item: DispositionConfig) => {
    setDispositions((prev) =>
      prev.map((d) => (d.id === item.id ? { ...d, isActive: !d.isActive } : d)),
    );
    try {
      const updated = await updateDisposition(item.id, {
        isActive: !item.isActive,
      });
      setDispositions((prev) =>
        prev.map((d) => (d.id === item.id ? updated : d)),
      );
    } catch {
      setDispositions((prev) => prev.map((d) => (d.id === item.id ? item : d)));
      toast({
        title: "Error",
        description: "Failed to update disposition",
        variant: "destructive",
      });
    }
  };

  const handleToggleTicketType = async (item: TicketTypeConfig) => {
    setTicketTypes((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, isActive: !t.isActive } : t)),
    );
    try {
      const updated = await updateTicketType(item.id, {
        isActive: !item.isActive,
      });
      setTicketTypes((prev) =>
        prev.map((t) => (t.id === item.id ? updated : t)),
      );
    } catch {
      setTicketTypes((prev) => prev.map((t) => (t.id === item.id ? item : t)));
      toast({
        title: "Error",
        description: "Failed to update ticket type",
        variant: "destructive",
      });
    }
  };

  const handleToggleCampaignType = async (item: CampaignTypeConfig) => {
    setCampaignTypes((prev) =>
      prev.map((t) => (t.id === item.id ? { ...t, isActive: !t.isActive } : t)),
    );
    try {
      const updated = await updateCampaignType(item.id, {
        isActive: !item.isActive,
      });
      setCampaignTypes((prev) =>
        prev.map((t) => (t.id === item.id ? { ...t, ...updated } : t)),
      );
    } catch {
      setCampaignTypes((prev) =>
        prev.map((t) => (t.id === item.id ? item : t)),
      );
      toast({
        title: "Error",
        description: "Failed to update campaign type",
        variant: "destructive",
      });
    }
  };

  const handleToggleCampaignOption = async (item: CampaignOptionConfig) => {
    setCampaignTypes((prev) =>
      prev.map((t) => ({
        ...t,
        options: t.options.map((o) =>
          o.id === item.id ? { ...o, isActive: !o.isActive } : o,
        ),
      })),
    );
    try {
      const updated = await updateCampaignOption(item.id, {
        isActive: !item.isActive,
      });
      setCampaignTypes((prev) =>
        prev.map((t) => ({
          ...t,
          options: t.options.map((o) =>
            o.id === item.id ? { ...o, ...updated } : o,
          ),
        })),
      );
    } catch {
      setCampaignTypes((prev) =>
        prev.map((t) => ({
          ...t,
          options: t.options.map((o) => (o.id === item.id ? item : o)),
        })),
      );
      toast({
        title: "Error",
        description: "Failed to update option",
        variant: "destructive",
      });
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async (value: string, label: string) => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      if (editTarget.kind === "disposition") {
        if (editTarget.item) {
          const updated = await updateDisposition(editTarget.item.id, {
            label,
          });
          setDispositions((prev) =>
            prev.map((d) => (d.id === editTarget.item!.id ? updated : d)),
          );
        } else {
          const created = await createDisposition({
            value,
            label,
            isActive: true,
          });
          setDispositions((prev) => [...prev, created]);
        }
      } else if (editTarget.kind === "ticketType") {
        if (editTarget.item) {
          const updated = await updateTicketType(editTarget.item.id, { label });
          setTicketTypes((prev) =>
            prev.map((t) => (t.id === editTarget.item!.id ? updated : t)),
          );
        } else {
          const created = await createTicketType({
            value,
            label,
            isActive: true,
          });
          setTicketTypes((prev) => [...prev, created]);
        }
      } else if (editTarget.kind === "campaignType") {
        if (editTarget.item) {
          const updated = await updateCampaignType(editTarget.item.id, {
            label,
          });
          setCampaignTypes((prev) =>
            prev.map((t) =>
              t.id === editTarget.item!.id ? { ...t, ...updated } : t,
            ),
          );
        } else {
          const created = await createCampaignType({
            value,
            label,
            isActive: true,
          });
          setCampaignTypes((prev) => [...prev, { ...created, options: [] }]);
        }
      } else if (editTarget.kind === "campaignOption") {
        if (editTarget.item) {
          const updated = await updateCampaignOption(editTarget.item.id, {
            label,
          });
          setCampaignTypes((prev) =>
            prev.map((t) => ({
              ...t,
              options: t.options.map((o) =>
                o.id === editTarget.item!.id ? { ...o, ...updated } : o,
              ),
            })),
          );
        } else {
          const created = await createCampaignOption(
            editTarget.campaignTypeId,
            {
              value,
              label,
              isActive: true,
            },
          );
          setCampaignTypes((prev) =>
            prev.map((t) =>
              t.id === editTarget.campaignTypeId
                ? { ...t, options: [...t.options, created] }
                : t,
            ),
          );
        }
      }
      setEditTarget(null);
      toast({
        title: "Saved",
        description: "Configuration updated successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to save",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      if (deleteTarget.kind === "disposition") {
        await deleteDisposition(deleteTarget.item.id);
        setDispositions((prev) =>
          prev.filter((d) => d.id !== deleteTarget.item.id),
        );
      } else if (deleteTarget.kind === "ticketType") {
        await deleteTicketType(deleteTarget.item.id);
        setTicketTypes((prev) =>
          prev.filter((t) => t.id !== deleteTarget.item.id),
        );
      } else if (deleteTarget.kind === "campaignType") {
        await deleteCampaignType(deleteTarget.item.id);
        setCampaignTypes((prev) =>
          prev.filter((t) => t.id !== deleteTarget.item.id),
        );
      } else if (deleteTarget.kind === "campaignOption") {
        await deleteCampaignOption(deleteTarget.item.id);
        setCampaignTypes((prev) =>
          prev.map((t) => ({
            ...t,
            options: t.options.filter((o) => o.id !== deleteTarget.item.id),
          })),
        );
      }
      setDeleteTarget(null);
      toast({ title: "Deleted", description: "Item removed successfully." });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to delete",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived data ───────────────────────────────────────────────────────────

  const stats: Record<SectionKey, { total: number; active: number }> = {
    dispositions: {
      total: dispositions.length,
      active: dispositions.filter((d) => d.isActive).length,
    },
    ticketTypes: {
      total: ticketTypes.length,
      active: ticketTypes.filter((t) => t.isActive).length,
    },
    campaignTypes: {
      total: campaignTypes.length,
      active: campaignTypes.filter((t) => t.isActive).length,
    },
  };

  const normalizedQuery = query.trim().toLowerCase();
  const matches = (item: { label: string; value: string }) =>
    !normalizedQuery ||
    item.label.toLowerCase().includes(normalizedQuery) ||
    item.value.toLowerCase().includes(normalizedQuery);

  const filteredDispositions = useMemo(
    () => dispositions.filter(matches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispositions, normalizedQuery],
  );
  const filteredTicketTypes = useMemo(
    () => ticketTypes.filter(matches),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ticketTypes, normalizedQuery],
  );
  const filteredCampaignTypes = useMemo(
    () =>
      campaignTypes.filter(
        (type) => matches(type) || type.options.some(matches),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [campaignTypes, normalizedQuery],
  );

  const section = SECTIONS.find((s) => s.key === activeSection)!;

  const handleAdd = () => {
    if (activeSection === "dispositions")
      setEditTarget({ kind: "disposition" });
    else if (activeSection === "ticketTypes")
      setEditTarget({ kind: "ticketType" });
    else setEditTarget({ kind: "campaignType" });
  };

  return (
    <div className="px-3 pt-2 pb-8 lg:px-5">
      {/* Page header */}
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className="h-7 w-0.5 shrink-0 rounded-full bg-[#008f68]"
          aria-hidden
        />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Workspace
          </p>
          <h1 className="text-[15px] font-bold tracking-[-0.02em] text-slate-900 dark:text-neutral-50">
            Configuration
          </h1>
        </div>
      </div>

      {/* KPI strip — one tile per section, click to switch */}
      <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {SECTIONS.map((tile) => {
          const Icon = tile.icon;
          const isActive = activeSection === tile.key;
          const { total, active } = stats[tile.key];
          const inactive = total - active;
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => selectSection(tile.key)}
              aria-pressed={isActive}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25",
                isActive
                  ? "border-[#008f68]/35 bg-[#f0faf5] ring-1 ring-[#008f68]/15 dark:border-emerald-500/30 dark:bg-emerald-950/20"
                  : "border-slate-200/80 bg-white hover:border-slate-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  isActive ? "bg-[#008f68]/10" : tile.bg,
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    isActive
                      ? "text-[#008f68] dark:text-emerald-300"
                      : tile.color,
                  )}
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                  {tile.label}
                </span>
                <span className="flex items-baseline gap-1.5">
                  {loading ? (
                    <Loader2
                      className="mt-1 size-3.5 animate-spin text-slate-300"
                      aria-hidden
                    />
                  ) : (
                    <>
                      <span className="text-lg font-bold leading-none tabular-nums text-slate-900 dark:text-neutral-100">
                        {total}
                      </span>
                      <span className="truncate text-[10px] font-medium text-slate-400">
                        <span className="font-semibold text-[#008f68] dark:text-emerald-300">
                          {active} active
                        </span>
                        {inactive > 0 ? ` · ${inactive} off` : ""}
                      </span>
                    </>
                  )}
                </span>
              </span>
              <ChevronRight
                className={cn(
                  "size-3.5 shrink-0 transition-transform",
                  isActive
                    ? "rotate-90 text-[#008f68] dark:text-emerald-300"
                    : "text-slate-300",
                )}
                aria-hidden
              />
            </button>
          );
        })}
      </div>

      {/* Main panel */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-neutral-800 dark:bg-neutral-950">
        <div
          className="h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent"
          aria-hidden
        />

        {/* Toolbar: segmented tabs + search + add */}
        <div className="flex flex-col gap-2 border-b border-slate-100 px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">
          <div className="flex w-full rounded-lg border border-slate-200/80 bg-slate-100 p-1 sm:w-auto sm:min-w-[280px] dark:border-neutral-800 dark:bg-neutral-900/80">
            {SECTIONS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => selectSection(tab.key)}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-xs transition-colors sm:flex-none",
                  activeSection === tab.key
                    ? "bg-white font-semibold text-[#008f68] shadow-sm dark:bg-neutral-950 dark:text-emerald-300"
                    : "font-medium text-slate-500 hover:text-slate-800 dark:text-neutral-400 dark:hover:text-slate-200",
                )}
              >
                {tab.shortLabel}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${section.shortLabel.toLowerCase()}...`}
                className="h-8 w-full rounded-lg border border-transparent bg-slate-50 pl-8 pr-7 text-xs text-slate-700 placeholder:text-slate-400 hover:border-slate-300 focus:border-[#008f68] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008f68]/20 sm:w-52 dark:bg-neutral-900 dark:text-neutral-200"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </div>
            <TealButton onClick={handleAdd} label={section.addLabel} />
          </div>
        </div>

        {/* Section heading */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/60 px-3.5 py-2 dark:border-neutral-800 dark:bg-neutral-900/40">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {section.label}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-neutral-400">
              {section.description}
            </p>
          </div>
          {!loading ? (
            <span className="shrink-0 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500 dark:bg-neutral-800 dark:text-neutral-300">
              {activeSection === "dispositions"
                ? filteredDispositions.length
                : activeSection === "ticketTypes"
                  ? filteredTicketTypes.length
                  : filteredCampaignTypes.length}{" "}
              shown
            </span>
          ) : null}
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-xs font-medium text-slate-400">
            <Loader2
              className="size-4 animate-spin text-[#008f68]"
              aria-hidden
            />
            Loading configuration...
          </div>
        ) : (
          <div key={activeSection} className="animate-in fade-in duration-200">
            {activeSection === "dispositions" && (
              <ConfigList
                items={filteredDispositions}
                searching={normalizedQuery.length > 0}
                onEdit={(item) => setEditTarget({ kind: "disposition", item })}
                onDelete={(item) =>
                  setDeleteTarget({ kind: "disposition", item })
                }
                onToggle={handleToggleDisposition}
              />
            )}

            {activeSection === "ticketTypes" && (
              <ConfigList
                items={filteredTicketTypes}
                searching={normalizedQuery.length > 0}
                onEdit={(item) => setEditTarget({ kind: "ticketType", item })}
                onDelete={(item) =>
                  setDeleteTarget({ kind: "ticketType", item })
                }
                onToggle={handleToggleTicketType}
              />
            )}

            {activeSection === "campaignTypes" &&
              (filteredCampaignTypes.length === 0 ? (
                <EmptyState searching={normalizedQuery.length > 0} />
              ) : (
                <div>
                  {filteredCampaignTypes.map((type) => {
                    const expanded = expandedTypes.has(type.id);
                    const activeOptions = type.options.filter(
                      (o) => o.isActive,
                    ).length;
                    return (
                      <div
                        key={type.id}
                        className="border-t border-slate-100 first:border-t-0 dark:border-neutral-800"
                      >
                        <div
                          className={cn(
                            "flex items-center gap-2 px-3.5 py-2 transition-colors",
                            expanded
                              ? "bg-[#f0faf5]/60 dark:bg-emerald-950/10"
                              : "hover:bg-[#f0faf5]/40 dark:hover:bg-slate-900/60",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleExpanded(type.id)}
                            aria-expanded={expanded}
                            aria-label={`Toggle options for ${type.label}`}
                            className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 dark:hover:bg-slate-800"
                          >
                            {expanded ? (
                              <ChevronDown className="size-3.5" />
                            ) : (
                              <ChevronRight className="size-3.5" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleExpanded(type.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <span
                              className={cn(
                                "block truncate text-[12px] font-semibold",
                                type.isActive
                                  ? "text-slate-800 dark:text-neutral-100"
                                  : "text-slate-400 line-through",
                              )}
                            >
                              {type.label}
                            </span>
                            <span className="block text-[10px] text-slate-400 tabular-nums">
                              {type.options.length} option
                              {type.options.length === 1 ? "" : "s"}
                              {type.options.length > 0
                                ? ` · ${activeOptions} active`
                                : ""}
                            </span>
                          </button>

                          <code className="hidden shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:block dark:bg-neutral-800">
                            {type.value}
                          </code>
                          <StatusPill active={type.isActive} />
                          <div className="flex shrink-0 items-center gap-0.5">
                            <ToggleBtn
                              active={type.isActive}
                              onClick={() => handleToggleCampaignType(type)}
                            />
                            <ActionBtn
                              icon={Pencil}
                              label="Edit"
                              onClick={() =>
                                setEditTarget({
                                  kind: "campaignType",
                                  item: type,
                                })
                              }
                            />
                            <ActionBtn
                              icon={Trash2}
                              label="Delete"
                              onClick={() =>
                                setDeleteTarget({
                                  kind: "campaignType",
                                  item: type,
                                })
                              }
                              danger
                            />
                          </div>
                        </div>

                        {expanded && (
                          <div className="border-t border-slate-100 bg-[#f4f5f7] px-3.5 pb-3 pt-2.5 animate-in fade-in slide-in-from-top-1 duration-200 dark:border-neutral-800 dark:bg-neutral-900/60">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                Options for {type.label}
                              </p>
                              <TealButton
                                onClick={() =>
                                  setEditTarget({
                                    kind: "campaignOption",
                                    campaignTypeId: type.id,
                                  })
                                }
                                label="Add option"
                                small
                              />
                            </div>

                            {type.options.length === 0 ? (
                              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-center text-[11px] font-medium text-slate-400 dark:border-neutral-700">
                                No options yet — add the first outcome for this
                                type.
                              </p>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {type.options.map((opt) => (
                                  <div
                                    key={opt.id}
                                    className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-neutral-800 dark:bg-neutral-950"
                                  >
                                    <span
                                      className={cn(
                                        "min-w-0 flex-1 truncate text-[12px] font-medium",
                                        opt.isActive
                                          ? "text-slate-700 dark:text-neutral-200"
                                          : "text-slate-400 line-through",
                                      )}
                                    >
                                      {opt.label}
                                    </span>
                                    <code className="hidden shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:block dark:bg-neutral-800">
                                      {opt.value}
                                    </code>
                                    <StatusPill active={opt.isActive} />
                                    <div className="flex shrink-0 items-center gap-0.5">
                                      <ToggleBtn
                                        active={opt.isActive}
                                        onClick={() =>
                                          handleToggleCampaignOption(opt)
                                        }
                                      />
                                      <ActionBtn
                                        icon={Pencil}
                                        label="Edit"
                                        onClick={() =>
                                          setEditTarget({
                                            kind: "campaignOption",
                                            campaignTypeId: type.id,
                                            item: opt,
                                          })
                                        }
                                      />
                                      <ActionBtn
                                        icon={Trash2}
                                        label="Delete"
                                        onClick={() =>
                                          setDeleteTarget({
                                            kind: "campaignOption",
                                            item: opt,
                                          })
                                        }
                                        danger
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Modals */}
      <ConfigItemModal
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        title={
          editTarget?.kind === "disposition"
            ? editTarget.item
              ? "Edit Disposition"
              : "New Disposition"
            : editTarget?.kind === "ticketType"
              ? editTarget.item
                ? "Edit Ticket Type"
                : "New Ticket Type"
              : editTarget?.kind === "campaignType"
                ? editTarget.item
                  ? "Edit Campaign Type"
                  : "New Campaign Type"
                : editTarget?.kind === "campaignOption"
                  ? editTarget.item
                    ? "Edit Option"
                    : "New Option"
                  : ""
        }
        initialValue={
          editTarget?.kind === "campaignOption"
            ? (editTarget.item?.value ?? "")
            : ((editTarget as any)?.item?.value ?? "")
        }
        initialLabel={
          editTarget?.kind === "campaignOption"
            ? (editTarget.item?.label ?? "")
            : ((editTarget as any)?.item?.label ?? "")
        }
        isEditing={!!(editTarget as any)?.item}
        submitting={submitting}
        onSave={handleSave}
      />

      <ConfirmDeleteModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        label={
          deleteTarget?.kind === "campaignOption"
            ? deleteTarget.item.label
            : ((deleteTarget as any)?.item?.label ?? "")
        }
        submitting={submitting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ConfigList<
  T extends { id: number; value: string; label: string; isActive: boolean },
>({
  items,
  searching,
  onEdit,
  onDelete,
  onToggle,
}: {
  items: T[];
  searching: boolean;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onToggle: (item: T) => void;
}) {
  if (items.length === 0) {
    return <EmptyState searching={searching} />;
  }
  return (
    <div>
      {/* Column header */}
      <div className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50/80 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:border-neutral-800 dark:bg-neutral-900/60">
        <span className="flex-1">Label</span>
        <span className="hidden w-28 sm:block">Value</span>
        <span className="w-[60px] text-center">Status</span>
        <span className="w-[88px] text-right">Actions</span>
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2.5 border-t border-slate-100 px-3.5 py-2 transition-colors first:border-t-0 hover:bg-[#f0faf5]/40 dark:border-neutral-800 dark:hover:bg-slate-900/60"
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[12px] font-medium",
              item.isActive
                ? "text-slate-800 dark:text-neutral-100"
                : "text-slate-400 line-through",
            )}
            title={item.label}
          >
            {item.label}
          </span>

          <span className="hidden w-28 sm:block">
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 dark:bg-neutral-800">
              {item.value}
            </code>
          </span>

          <span className="flex w-[60px] justify-center">
            <StatusPill active={item.isActive} />
          </span>

          <div className="flex w-[88px] shrink-0 items-center justify-end gap-0.5">
            <ToggleBtn active={item.isActive} onClick={() => onToggle(item)} />
            <ActionBtn
              icon={Pencil}
              label="Edit"
              onClick={() => onEdit(item)}
            />
            <ActionBtn
              icon={Trash2}
              label="Delete"
              onClick={() => onDelete(item)}
              danger
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-4 py-12 text-center">
      <span className="flex size-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-neutral-800">
        <Inbox className="size-4 text-slate-400" aria-hidden />
      </span>
      <p className="text-xs font-medium text-slate-500 dark:text-neutral-400">
        {searching ? "No items match your search" : "Nothing configured yet"}
      </p>
      <p className="text-[11px] text-slate-400">
        {searching
          ? "Try a different term or clear the search."
          : "Use the add button above to create the first item."}
      </p>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider",
        active
          ? "border-emerald-200 bg-[#f0faf5] text-[#008f68] dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "border-slate-200 bg-slate-50 text-slate-400 dark:border-neutral-700 dark:bg-neutral-800",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-[#008f68]" : "bg-slate-300 dark:bg-neutral-600",
        )}
        aria-hidden
      />
      {active ? "Active" : "Off"}
    </span>
  );
}

function ToggleBtn({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      title={active ? "Deactivate" : "Activate"}
      onClick={onClick}
      className={cn(
        "flex h-5 w-9 shrink-0 items-center rounded-full border px-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25",
        active
          ? "border-[#008f68]/30 bg-[#008f68]"
          : "border-slate-200 bg-slate-100 dark:border-neutral-700 dark:bg-neutral-800",
      )}
    >
      <span
        className={cn(
          "size-3.5 rounded-full bg-white shadow-sm transition-transform",
          active ? "translate-x-[14px]" : "translate-x-0",
        )}
      />
    </button>
  );
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "rounded-md p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25",
        danger
          ? "text-slate-300 hover:bg-red-50 hover:text-red-500 dark:text-neutral-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

function TealButton({
  onClick,
  label,
  small,
}: {
  onClick: () => void;
  label: string;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-lg bg-[#008f68] font-semibold text-white shadow-sm transition-colors hover:bg-[#007a5a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25 active:scale-95",
        small ? "h-6 px-2.5 text-[10px]" : "h-8 px-3 text-xs",
      )}
    >
      <Plus className={cn("shrink-0", small ? "size-3" : "size-3.5")} />
      {label}
    </button>
  );
}
