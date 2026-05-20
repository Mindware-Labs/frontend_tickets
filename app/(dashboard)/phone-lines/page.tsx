"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useRole } from "@/components/providers/role-provider";
import { fetchFromBackend } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneLine, PhoneLineFormData } from "./types";
import { PhoneLinesToolbar } from "./components/PhoneLinesToolbar";
import { PhoneLinesTable } from "./components/PhoneLinesTable";

const PhoneLineFormModal = dynamic(
  () => import("./components/PhoneLineFormModal").then((m) => m.PhoneLineFormModal),
  { ssr: false },
);
const DeletePhoneLineModal = dynamic(
  () => import("./components/DeletePhoneLineModal").then((m) => m.DeletePhoneLineModal),
  { ssr: false },
);

const ITEMS_PER_PAGE = 10;

const DEFAULT_FORM: PhoneLineFormData = {
  phoneNumber: "",
  label: "",
  isActive: true,
};

export default function PhoneLinesPage() {
  const { role } = useRole();
  const normalizedRole = role?.toString().toLowerCase();
  const canManage = normalizedRole !== "agent";

  const [lines, setLines] = useState<PhoneLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLines, setSelectedLines] = useState<number[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
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
      toast({ title: "Error", description: "Failed to load phone lines", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLines(); }, []);

  const pathname = usePathname();
  useEffect(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
  }, [pathname]);

  const filteredLines = useMemo(() => {
    const term = search.toLowerCase();
    return lines.filter(
      (line) =>
        line.phoneNumber.includes(term) ||
        (line.label || "").toLowerCase().includes(term)
    );
  }, [lines, search]);

  const totalPages = Math.ceil(filteredLines.length / ITEMS_PER_PAGE);
  const paginatedLines = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLines.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLines, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedLines([]);
  }, [search]);

  const resetForm = () => setFormData(DEFAULT_FORM);
  const clearErrors = () => setValidationErrors({});

  const formatForEdit = (digits: string): string => {
    const clean = digits.startsWith("1") ? digits.slice(1) : digits;
    if (clean.length === 0) return "";
    if (clean.length <= 3) return `+1 ${clean}`;
    if (clean.length <= 6) return `+1 ${clean.slice(0, 3)}-${clean.slice(3)}`;
    return `+1 ${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
  };

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
    setFormData({ phoneNumber: formatForEdit(line.phoneNumber), label: line.label || "", isActive: line.isActive });
    clearErrors();
    setShowEditModal(true);
  };

  const handleDelete = (line: PhoneLine) => {
    setSelectedLine(line);
    setShowDeleteModal(true);
  };

  const handleSubmitCreate = async () => {
    clearErrors();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({ title: "Validation Error", description: "Please fill in all required fields correctly", variant: "destructive" });
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
      fetchLines();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create phone line", variant: "destructive" });
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
      toast({ title: "Validation Error", description: "Please fill in all required fields correctly", variant: "destructive" });
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
      fetchLines();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update phone line", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedLine) return;
    try {
      setIsSubmitting(true);
      await fetchFromBackend(`/phone-lines/${selectedLine.id}`, { method: "DELETE" });
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
      setSelectedLines((prev) => prev.filter((id) => id !== selectedLine.id));
      setSelectedLine(null);
      fetchLines();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete phone line", variant: "destructive" });
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
    <div className="h-screen flex flex-col px-4 pt-4 pb-4 gap-0">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between w-full py-5 px-0.5 gap-3 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
            Phone Lines
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{today}</p>
        </div>

        {canManage && (
          <Button
            onClick={handleCreate}
            className="h-9 px-4 rounded-xl bg-[#008f68] hover:bg-[#007a5a] text-white text-[13px] font-medium shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Line
          </Button>
        )}
      </div>

      {/* Toolbar */}
      <div className="mt-3 mb-2">
        <PhoneLinesToolbar
          search={search}
          onSearchChange={setSearch}
          selectedCount={selectedLines.length}
          onClearSelection={() => setSelectedLines([])}
        />
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0">
        <PhoneLinesTable
          loading={loading}
          lines={paginatedLines}
          totalFiltered={filteredLines.length}
          selectedLines={selectedLines}
          onSelectionChange={setSelectedLines}
          onEdit={canManage ? handleEdit : undefined}
          onDelete={canManage ? handleDelete : undefined}
          canManage={canManage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          totalPages={totalPages}
        />
      </div>

      {canManage && (
        <>
          <PhoneLineFormModal
            open={showCreateModal}
            onOpenChange={(open) => { setShowCreateModal(open); if (!open) clearErrors(); }}
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
            onOpenChange={(open) => { setShowEditModal(open); if (!open) clearErrors(); }}
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
            isSubmitting={isSubmitting}
            onConfirm={handleSubmitDelete}
          />
        </>
      )}
    </div>
  );
}
