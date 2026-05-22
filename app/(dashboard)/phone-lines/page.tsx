"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { CheckCircle2, Plus } from "lucide-react";

import { useRole } from "@/components/providers/role-provider";
import { fetchFromBackend } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { PhoneLine, PhoneLineFormData } from "./types";
import { PhoneLinesToolbar } from "./components/PhoneLinesToolbar";
import { PhoneLinesTable } from "./components/PhoneLinesTable";
import { formatPhoneForEdit } from "./utils";

const PhoneLineFormModal = dynamic(
  () => import("./components/PhoneLineFormModal").then((m) => m.PhoneLineFormModal),
  { ssr: false },
);
const DeletePhoneLineModal = dynamic(
  () => import("./components/DeletePhoneLineModal").then((m) => m.DeletePhoneLineModal),
  { ssr: false },
);
const PhoneLineSheet = dynamic(
  () => import("./components/PhoneLineSheet").then((m) => m.PhoneLineSheet),
  { ssr: false },
);

const ITEMS_PER_PAGE = 10;

const DEFAULT_FORM: PhoneLineFormData = {
  phoneNumber: "",
  label: "",
  isActive: true,
};

const VIEW_TABS = [
  { key: "all", label: "All Lines" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
] as const;

type LineView = (typeof VIEW_TABS)[number]["key"];

const getLineFormData = (line: PhoneLine): PhoneLineFormData => ({
  phoneNumber: formatPhoneForEdit(line.phoneNumber),
  label: line.label || "",
  isActive: line.isActive,
});

export default function PhoneLinesPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useRole();

  const isAgent = role?.toString().toLowerCase() === "agent";
  const canManage = !isAgent;
  const phoneLineIdParam = searchParams?.get("phoneLineId");
  const phoneLineIdFilter = phoneLineIdParam ? Number(phoneLineIdParam) : null;

  const [lines, setLines] = useState<PhoneLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<LineView>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLineSheet, setShowLineSheet] = useState(false);
  const [selectedLine, setSelectedLine] = useState<PhoneLine | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<PhoneLineFormData>(DEFAULT_FORM);

  const fetchLines = async () => {
    try {
      setLoading(true);
      const data = await fetchFromBackend("/phone-lines");
      setLines(Array.isArray(data) ? data : []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load phone lines",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLines();
  }, []);

  useEffect(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowLineSheet(false);
  }, [pathname]);

  useEffect(() => {
    if (!phoneLineIdFilter || loading || lines.length === 0) return;
    const match = lines.find((l) => l.id === phoneLineIdFilter);
    if (match) {
      setSelectedLine(match);
      setShowLineSheet(true);
    }
  }, [phoneLineIdFilter, loading, lines.length]);

  const handleLineSheetOpenChange = (open: boolean) => {
    setShowLineSheet(open);
    if (!open) {
      setSelectedLine(null);
      if (phoneLineIdParam) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("phoneLineId");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    }
  };

  const viewCounts = useMemo(() => {
    const base = lines.filter((line) => {
      const term = search.toLowerCase();
      if (!term) return true;
      return (
        line.phoneNumber.includes(term) ||
        (line.label || "").toLowerCase().includes(term)
      );
    });

    return {
      all: base.length,
      active: base.filter((l) => l.isActive).length,
      inactive: base.filter((l) => !l.isActive).length,
    };
  }, [lines, search]);

  const filteredLines = useMemo(() => {
    return lines
      .filter((line) => {
        const term = search.toLowerCase();
        const matchesSearch =
          !term ||
          line.phoneNumber.includes(term) ||
          (line.label || "").toLowerCase().includes(term);

        const matchesView =
          activeView === "all" ||
          (activeView === "active" && line.isActive) ||
          (activeView === "inactive" && !line.isActive);

        const matchesQuery = phoneLineIdFilter
          ? line.id === phoneLineIdFilter
          : true;

        return matchesSearch && matchesView && matchesQuery;
      })
      .sort((a, b) => a.id - b.id);
  }, [lines, search, activeView, phoneLineIdFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLines.length / ITEMS_PER_PAGE));

  const paginatedLines = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLines.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLines, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeView, phoneLineIdFilter]);

  const resetForm = () => setFormData(DEFAULT_FORM);
  const clearErrors = () => setValidationErrors({});

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const digits = formData.phoneNumber.replace(/\D/g, "");
    if (!digits) errors.phoneNumber = "Phone number is required";
    return errors;
  };

  const handleCreate = () => {
    resetForm();
    clearErrors();
    setShowCreateModal(true);
  };

  const handleEdit = (line: PhoneLine) => {
    setSelectedLine(line);
    setFormData(getLineFormData(line));
    clearErrors();
    setShowEditModal(true);
  };

  const handleDelete = (line: PhoneLine) => {
    setSelectedLine(line);
    setShowDeleteModal(true);
  };

  const handleRowClick = (line: PhoneLine) => {
    setSelectedLine(line);
    setShowLineSheet(true);
  };

  const handleSubmitCreate = async () => {
    clearErrors();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSubmitting(true);
      await fetchFromBackend("/phone-lines", {
        method: "POST",
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber.replace(/\D/g, ""),
          label: formData.label.trim() || undefined,
          isActive: formData.isActive,
        }),
      });
      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Phone line created successfully</span>
          </div>
        ),
      });
      setShowCreateModal(false);
      resetForm();
      await fetchLines();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to create phone line",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedLine) return;
    clearErrors();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsSubmitting(true);
      await fetchFromBackend(`/phone-lines/${selectedLine.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          phoneNumber: formData.phoneNumber.replace(/\D/g, ""),
          label: formData.label.trim() || undefined,
          isActive: formData.isActive,
        }),
      });
      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Phone line updated successfully</span>
          </div>
        ),
      });
      setShowEditModal(false);
      setSelectedLine(null);
      resetForm();
      await fetchLines();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to update phone line",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedLine) return;
    try {
      setIsSubmitting(true);
      await fetchFromBackend(`/phone-lines/${selectedLine.id}`, {
        method: "DELETE",
      });
      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Phone line deleted successfully</span>
          </div>
        ),
      });
      setShowDeleteModal(false);
      setSelectedLine(null);
      await fetchLines();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to delete phone line",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="h-screen flex flex-col px-4 pt-2 pb-4 gap-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between w-full pt-2 pb-5 px-0.5 gap-3 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
            Phone Lines
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {today} · Manage Aircall lines that create tickets
          </p>
        </div>
      </div>

      <div className="flex border-b border-border mt-1 items-end">
        <div className="flex flex-1 min-w-0 items-end overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex px-0.5">
            {VIEW_TABS.map((tab) => {
              const isActive = activeView === tab.key;
              const count = viewCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveView(tab.key)}
                  className={cn(
                    "px-2 py-2.5 text-[13px] font-medium border-b-2 mr-4 flex items-center gap-2 transition-colors -mb-px whitespace-nowrap",
                    isActive
                      ? "border-[#008f68] text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "py-px px-1.5 rounded-full text-[11px] border",
                      isActive
                        ? "bg-[#e2fae9] text-[#008f68] font-semibold border-[#e2fae9]"
                        : "bg-muted/40 text-muted-foreground font-medium border-border",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {canManage && (
          <div className="shrink-0 pl-4 pr-2 pb-2 pt-0.5">
            <button
              type="button"
              onClick={handleCreate}
              className="flex h-[30px] items-center gap-1.5 rounded-full px-4 text-[12.5px] font-semibold text-white shadow-sm transition-all active:scale-95"
              style={{ background: "#008f68" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#007a5a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#008f68";
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              New Line
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 mb-2">
        <PhoneLinesToolbar search={search} onSearchChange={setSearch} />
      </div>

      <PhoneLinesTable
          loading={loading}
          lines={paginatedLines}
          totalFiltered={filteredLines.length}
          onRowClick={handleRowClick}
          onEdit={canManage ? handleEdit : undefined}
          onDelete={canManage ? handleDelete : undefined}
          canManage={canManage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          totalPages={totalPages}
        />

      {canManage && (
        <>
          <PhoneLineFormModal
            open={showCreateModal}
            onOpenChange={(open) => {
              setShowCreateModal(open);
              if (!open) clearErrors();
            }}
            title="Add Phone Line"
            description="Add a new Aircall line that will generate tickets"
            submitLabel="Add Line"
            isSubmitting={isSubmitting}
            formData={formData}
            onFormChange={setFormData}
            validationErrors={validationErrors}
            onValidationErrorChange={setValidationErrors}
            onSubmit={handleSubmitCreate}
            idPrefix="create"
          />

          <PhoneLineFormModal
            open={showEditModal}
            onOpenChange={(open) => {
              setShowEditModal(open);
              if (!open) clearErrors();
            }}
            title="Edit Phone Line"
            description="Update the phone line details"
            submitLabel="Save Changes"
            isSubmitting={isSubmitting}
            formData={formData}
            onFormChange={setFormData}
            validationErrors={validationErrors}
            onValidationErrorChange={setValidationErrors}
            onSubmit={handleSubmitEdit}
            idPrefix="edit"
          />

          <DeletePhoneLineModal
            open={showDeleteModal}
            onOpenChange={setShowDeleteModal}
            phoneNumber={selectedLine?.phoneNumber}
            label={selectedLine?.label}
            isSubmitting={isSubmitting}
            onConfirm={handleSubmitDelete}
          />
        </>
      )}

      <PhoneLineSheet
        open={showLineSheet}
        onOpenChange={handleLineSheetOpenChange}
        line={selectedLine}
        onEdit={canManage ? handleEdit : undefined}
      />
    </div>
  );
}
