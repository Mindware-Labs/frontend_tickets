"use client";

import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Settings,
  Tag,
  TicketIcon,
  Megaphone,
  Phone,
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
    description: "Outcomes agents select when logging a call",
    icon: Phone,
    color: "text-sky-600",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    border: "border-sky-200/70 dark:border-sky-800/50",
    activeBorder: "border-[#008f68]/40",
    activeBg: "bg-[#f0faf5]",
  },
  {
    key: "ticketTypes" as const,
    label: "Ticket Types",
    description: "Classifications available when creating or updating a ticket",
    icon: TicketIcon,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    border: "border-violet-200/70 dark:border-violet-800/50",
    activeBorder: "border-[#008f68]/40",
    activeBg: "bg-[#f0faf5]",
  },
  {
    key: "campaignTypes" as const,
    label: "Campaign Types & Options",
    description: "Campaign categories, each with their own outcome options",
    icon: Megaphone,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200/70 dark:border-amber-800/50",
    activeBorder: "border-[#008f68]/40",
    activeBg: "bg-[#f0faf5]",
  },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

type EditTarget =
  | { kind: "disposition"; item?: DispositionConfig }
  | { kind: "ticketType"; item?: TicketTypeConfig }
  | { kind: "campaignType"; item?: CampaignTypeConfig }
  | { kind: "campaignOption"; campaignTypeId: number; item?: CampaignOptionConfig };

type DeleteTarget =
  | { kind: "disposition"; item: DispositionConfig }
  | { kind: "ticketType"; item: TicketTypeConfig }
  | { kind: "campaignType"; item: CampaignTypeConfig }
  | { kind: "campaignOption"; item: CampaignOptionConfig };

export function SettingsClient() {
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<number>>(new Set());
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    dispositions,
    ticketTypes,
    campaignTypes,
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

  const handleCardClick = (key: SectionKey) => {
    setActiveSection((prev) => (prev === key ? null : key));
  };

  // ── Toggle active ──────────────────────────────────────────────────────────

  const handleToggleDisposition = async (item: DispositionConfig) => {
    setDispositions((prev) => prev.map((d) => (d.id === item.id ? { ...d, isActive: !d.isActive } : d)));
    try {
      const updated = await updateDisposition(item.id, { isActive: !item.isActive });
      setDispositions((prev) => prev.map((d) => (d.id === item.id ? updated : d)));
    } catch {
      setDispositions((prev) => prev.map((d) => (d.id === item.id ? item : d)));
      toast({ title: "Error", description: "Failed to update disposition", variant: "destructive" });
    }
  };

  const handleToggleTicketType = async (item: TicketTypeConfig) => {
    setTicketTypes((prev) => prev.map((t) => (t.id === item.id ? { ...t, isActive: !t.isActive } : t)));
    try {
      const updated = await updateTicketType(item.id, { isActive: !item.isActive });
      setTicketTypes((prev) => prev.map((t) => (t.id === item.id ? updated : t)));
    } catch {
      setTicketTypes((prev) => prev.map((t) => (t.id === item.id ? item : t)));
      toast({ title: "Error", description: "Failed to update ticket type", variant: "destructive" });
    }
  };

  const handleToggleCampaignType = async (item: CampaignTypeConfig) => {
    setCampaignTypes((prev) => prev.map((t) => (t.id === item.id ? { ...t, isActive: !t.isActive } : t)));
    try {
      const updated = await updateCampaignType(item.id, { isActive: !item.isActive });
      setCampaignTypes((prev) => prev.map((t) => (t.id === item.id ? { ...t, ...updated } : t)));
    } catch {
      setCampaignTypes((prev) => prev.map((t) => (t.id === item.id ? item : t)));
      toast({ title: "Error", description: "Failed to update campaign type", variant: "destructive" });
    }
  };

  const handleToggleCampaignOption = async (item: CampaignOptionConfig) => {
    setCampaignTypes((prev) =>
      prev.map((t) => ({ ...t, options: t.options.map((o) => (o.id === item.id ? { ...o, isActive: !o.isActive } : o)) })),
    );
    try {
      const updated = await updateCampaignOption(item.id, { isActive: !item.isActive });
      setCampaignTypes((prev) =>
        prev.map((t) => ({ ...t, options: t.options.map((o) => (o.id === item.id ? { ...o, ...updated } : o)) })),
      );
    } catch {
      setCampaignTypes((prev) =>
        prev.map((t) => ({ ...t, options: t.options.map((o) => (o.id === item.id ? item : o)) })),
      );
      toast({ title: "Error", description: "Failed to update option", variant: "destructive" });
    }
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async (value: string, label: string) => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      if (editTarget.kind === "disposition") {
        if (editTarget.item) {
          const updated = await updateDisposition(editTarget.item.id, { label });
          setDispositions((prev) => prev.map((d) => (d.id === editTarget.item!.id ? updated : d)));
        } else {
          const created = await createDisposition({ value, label, isActive: true });
          setDispositions((prev) => [...prev, created]);
        }
      } else if (editTarget.kind === "ticketType") {
        if (editTarget.item) {
          const updated = await updateTicketType(editTarget.item.id, { label });
          setTicketTypes((prev) => prev.map((t) => (t.id === editTarget.item!.id ? updated : t)));
        } else {
          const created = await createTicketType({ value, label, isActive: true });
          setTicketTypes((prev) => [...prev, created]);
        }
      } else if (editTarget.kind === "campaignType") {
        if (editTarget.item) {
          const updated = await updateCampaignType(editTarget.item.id, { label });
          setCampaignTypes((prev) =>
            prev.map((t) => (t.id === editTarget.item!.id ? { ...t, ...updated } : t)),
          );
        } else {
          const created = await createCampaignType({ value, label, isActive: true });
          setCampaignTypes((prev) => [...prev, { ...created, options: [] }]);
        }
      } else if (editTarget.kind === "campaignOption") {
        if (editTarget.item) {
          const updated = await updateCampaignOption(editTarget.item.id, { label });
          setCampaignTypes((prev) =>
            prev.map((t) => ({
              ...t,
              options: t.options.map((o) =>
                o.id === editTarget.item!.id ? { ...o, ...updated } : o,
              ),
            })),
          );
        } else {
          const created = await createCampaignOption(editTarget.campaignTypeId, {
            value,
            label,
            isActive: true,
          });
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
      toast({ title: "Saved", description: "Configuration updated successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save", variant: "destructive" });
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
        setDispositions((prev) => prev.filter((d) => d.id !== deleteTarget.item.id));
      } else if (deleteTarget.kind === "ticketType") {
        await deleteTicketType(deleteTarget.item.id);
        setTicketTypes((prev) => prev.filter((t) => t.id !== deleteTarget.item.id));
      } else if (deleteTarget.kind === "campaignType") {
        await deleteCampaignType(deleteTarget.item.id);
        setCampaignTypes((prev) => prev.filter((t) => t.id !== deleteTarget.item.id));
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
      toast({ title: "Error", description: err?.message || "Failed to delete", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const activeDispositions = dispositions.filter((d) => d.isActive).length;
  const activeTicketTypes = ticketTypes.filter((t) => t.isActive).length;
  const activeCampaignTypes = campaignTypes.filter((t) => t.isActive).length;

  const counts = {
    dispositions: dispositions.length,
    ticketTypes: ticketTypes.length,
    campaignTypes: campaignTypes.length,
  };

  const activeCounts = {
    dispositions: activeDispositions,
    ticketTypes: activeTicketTypes,
    campaignTypes: activeCampaignTypes,
  };

  return (
    <div className="px-3 pt-2 pb-8 lg:px-5">
      {/* Page header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#008f68]/10">
          <Settings className="h-4 w-4 text-[#008f68]" />
        </div>
        <div>
          <h1 className="text-[15px] font-bold tracking-[-0.02em] text-slate-900 dark:text-slate-50">
            Configuration
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Manage dynamic options used across calls, tickets, and campaigns
          </p>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 w-full mb-4">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const active = activeSection === section.key;
          const total = counts[section.key];
          const activeCount = activeCounts[section.key];
          const inactiveCount = total - activeCount;
          const pct = total > 0 ? Math.round((activeCount / total) * 100) : 0;
          return (
            <button
              key={section.key}
              type="button"
              onClick={() => handleCardClick(section.key)}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200",
                active
                  ? "border-[#008f68]/40 bg-[#f0faf5] ring-1 ring-[#008f68]/20 dark:border-emerald-700/40 dark:bg-emerald-950/20"
                  : "border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:border-slate-800 dark:bg-slate-950",
              )}
            >
              {/* Top accent bar */}
              <div
                className={cn(
                  "h-0.5 w-full transition-all",
                  active
                    ? "bg-gradient-to-r from-transparent via-[#008f68]/60 to-transparent"
                    : "bg-gradient-to-r from-transparent via-slate-200/60 to-transparent group-hover:via-slate-300/60",
                )}
              />

              <div className="flex flex-col gap-4 p-5">
                {/* Icon + KPI count */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                      active
                        ? "border-[#008f68]/20 bg-[#008f68]/10"
                        : section.bg + " " + section.border,
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active ? "text-[#008f68]" : section.color)} />
                  </div>

                  <div className="text-right">
                    <p
                      className={cn(
                        "text-2xl font-bold tabular-nums leading-none",
                        active ? "text-[#008f68]" : "text-slate-800 dark:text-slate-100",
                      )}
                    >
                      {total}
                    </p>
                    <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                      total
                    </p>
                  </div>
                </div>

                {/* Title + description */}
                <div>
                  <p
                    className={cn(
                      "text-[13px] font-semibold leading-tight",
                      active ? "text-[#008f68]" : "text-slate-800 dark:text-slate-100",
                    )}
                  >
                    {section.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                    {section.description}
                  </p>
                </div>

                {/* Active / inactive breakdown */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-[#008f68]">
                      {activeCount} active
                    </span>
                    {inactiveCount > 0 && (
                      <span className="text-slate-400">{inactiveCount} inactive</span>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-[#008f68] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div
                className={cn(
                  "flex items-center gap-1.5 border-t px-5 py-2.5 text-[11px] font-medium transition-colors",
                  active
                    ? "border-[#008f68]/15 text-[#008f68]"
                    : "border-slate-100 text-slate-400 group-hover:text-slate-600 dark:border-slate-800",
                )}
              >
                {active ? (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    <span>Collapse</span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    <span>Manage</span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Panel content — shown below cards when one is active */}
      <div className="w-full">
        {activeSection === "dispositions" && (
          <ConfigPanel
            title="Call Dispositions"
            description="Outcomes agents can select when logging a call"
            items={dispositions}
            onAdd={() => setEditTarget({ kind: "disposition" })}
            onEdit={(item) => setEditTarget({ kind: "disposition", item })}
            onDelete={(item) => setDeleteTarget({ kind: "disposition", item })}
            onToggle={handleToggleDisposition}
          />
        )}

        {activeSection === "ticketTypes" && (
          <ConfigPanel
            title="Ticket Types"
            description="Classification types available when creating or updating a ticket"
            items={ticketTypes}
            onAdd={() => setEditTarget({ kind: "ticketType" })}
            onEdit={(item) => setEditTarget({ kind: "ticketType", item })}
            onDelete={(item) => setDeleteTarget({ kind: "ticketType", item })}
            onToggle={handleToggleTicketType}
          />
        )}

        {activeSection === "campaignTypes" && (
          <div className="flex flex-col gap-3">
            {/* Panel header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Campaign Types
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Each type has its own set of outcome options
                </p>
              </div>
              <TealButton
                onClick={() => setEditTarget({ kind: "campaignType" })}
                label="Add type"
              />
            </div>

            <div className="flex flex-col gap-2">
              {campaignTypes.length === 0 && (
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
                  <p className="py-8 text-center text-xs italic text-slate-400">
                    No campaign types configured
                  </p>
                </div>
              )}

              {campaignTypes.map((type) => {
                const expanded = expandedTypes.has(type.id);
                return (
                  <div
                    key={type.id}
                    className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(type.id)}
                        className="shrink-0 rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                      >
                        {expanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <span
                        className={cn(
                          "flex-1 text-[13px] font-semibold",
                          type.isActive
                            ? "text-slate-800 dark:text-slate-100"
                            : "text-slate-400 line-through",
                        )}
                      >
                        {type.label}
                      </span>

                      <StatusPill active={type.isActive} />

                      <div className="flex shrink-0 items-center gap-0.5">
                        <ToggleBtn
                          active={type.isActive}
                          onClick={() => handleToggleCampaignType(type)}
                        />
                        <ActionBtn
                          icon={Pencil}
                          label="Edit"
                          onClick={() => setEditTarget({ kind: "campaignType", item: type })}
                        />
                        <ActionBtn
                          icon={Trash2}
                          label="Delete"
                          onClick={() => setDeleteTarget({ kind: "campaignType", item: type })}
                          danger
                        />
                      </div>
                    </div>

                    {expanded && (
                      <div className="border-t border-slate-100 bg-[#f4f5f7] px-3.5 pb-3 pt-2.5 dark:border-slate-800 dark:bg-slate-900/60">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            Options for {type.label}
                          </p>
                          <TealButton
                            onClick={() =>
                              setEditTarget({ kind: "campaignOption", campaignTypeId: type.id })
                            }
                            label="Add option"
                            small
                          />
                        </div>

                        {type.options.length === 0 ? (
                          <p className="py-2 text-[11px] italic text-slate-400">No options yet</p>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {type.options.map((opt) => (
                              <div
                                key={opt.id}
                                className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-slate-800 dark:bg-slate-950"
                              >
                                <span
                                  className={cn(
                                    "flex-1 text-[12px] font-medium",
                                    opt.isActive
                                      ? "text-slate-700 dark:text-slate-200"
                                      : "text-slate-400 line-through",
                                  )}
                                >
                                  {opt.label}
                                </span>
                                <StatusPill active={opt.isActive} />
                                <div className="flex shrink-0 items-center gap-0.5">
                                  <ToggleBtn
                                    active={opt.isActive}
                                    onClick={() => handleToggleCampaignOption(opt)}
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
                                      setDeleteTarget({ kind: "campaignOption", item: opt })
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
          </div>
        )}
      </div>

      {/* Modals */}
      <ConfigItemModal
        open={editTarget !== null}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        title={
          editTarget?.kind === "disposition"
            ? editTarget.item ? "Edit Disposition" : "New Disposition"
            : editTarget?.kind === "ticketType"
              ? editTarget.item ? "Edit Ticket Type" : "New Ticket Type"
              : editTarget?.kind === "campaignType"
                ? editTarget.item ? "Edit Campaign Type" : "New Campaign Type"
                : editTarget?.kind === "campaignOption"
                  ? editTarget.item ? "Edit Option" : "New Option"
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
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
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

function ConfigPanel<
  T extends { id: number; value: string; label: string; isActive: boolean },
>({
  title,
  description,
  items,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
}: {
  title: string;
  description: string;
  items: T[];
  onAdd: () => void;
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onToggle: (item: T) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {title}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-500">{description}</p>
        </div>
        <TealButton onClick={onAdd} label="Add" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950">
        {items.length === 0 && (
          <p className="py-8 text-center text-xs italic text-slate-400">
            No items configured
          </p>
        )}
        {items.map((item, idx) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-2.5 px-3.5 py-2.5",
              idx !== 0 && "border-t border-slate-100 dark:border-slate-800",
            )}
          >
            <span
              className={cn(
                "flex-1 text-[12px] font-medium",
                item.isActive
                  ? "text-slate-800 dark:text-slate-100"
                  : "text-slate-400 line-through",
              )}
            >
              {item.label}
            </span>

            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 dark:bg-slate-800">
              {item.value}
            </span>

            <StatusPill active={item.isActive} />

            <div className="flex shrink-0 items-center gap-0.5">
              <ToggleBtn active={item.isActive} onClick={() => onToggle(item)} />
              <ActionBtn icon={Pencil} label="Edit" onClick={() => onEdit(item)} />
              <ActionBtn icon={Trash2} label="Delete" onClick={() => onDelete(item)} danger />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        active
          ? "bg-[#e2fae9] text-[#008f68]"
          : "bg-slate-100 text-slate-400 dark:bg-slate-800",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function ToggleBtn({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      title={active ? "Deactivate" : "Activate"}
      onClick={onClick}
      className={cn(
        "flex h-6 w-10 shrink-0 items-center rounded-full border px-0.5 transition-colors",
        active
          ? "border-[#008f68]/30 bg-[#008f68]"
          : "border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800",
      )}
    >
      <span
        className={cn(
          "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          active ? "translate-x-4" : "translate-x-0",
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
      onClick={onClick}
      className={cn(
        "rounded-md p-1 transition-colors",
        danger
          ? "text-slate-300 hover:bg-red-50 hover:text-red-500 dark:text-slate-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
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
        "flex shrink-0 items-center gap-1 rounded-lg bg-[#008f68] font-semibold text-white shadow-sm transition-colors hover:bg-[#007a5a] active:scale-95",
        small ? "h-6 px-2.5 text-[10px]" : "h-8 px-3.5 text-[12px]",
      )}
    >
      <Plus className={cn("shrink-0", small ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {label}
    </button>
  );
}
