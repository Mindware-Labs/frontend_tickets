"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useRole } from "@/components/providers/role-provider";
import { fetchFromBackend } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { PhoneLine, PhoneLineFormData } from "./types";
import { PhoneLinesToolbar } from "./components/PhoneLinesToolbar";
import { PhoneLinesTable } from "./components/PhoneLinesTable";
import { PhoneLinesPagination } from "./components/PhoneLinesPagination";
import { PhoneLineFormModal } from "./components/PhoneLineFormModal";
import { DeletePhoneLineModal } from "./components/DeletePhoneLineModal";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLine, setSelectedLine] = useState<PhoneLine | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [formData, setFormData] = useState<PhoneLineFormData>(DEFAULT_FORM);

  const fetchLines = async () => {
    try {
      setLoading(true);
      const data = await fetchFromBackend("/phone-lines");
      setLines(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching phone lines:", error);
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

  const totalPages = Math.ceil(filteredLines.length / itemsPerPage);
  const paginatedLines = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLines.slice(start, start + itemsPerPage);
  }, [filteredLines, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const resetForm = () => setFormData(DEFAULT_FORM);
  const clearValidationErrors = () => setValidationErrors({});

  // Format raw digits from DB into display format for the form
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
    clearValidationErrors();
    setShowCreateModal(true);
  };

  const handleEdit = (line: PhoneLine) => {
    setSelectedLine(line);
    setFormData({
      phoneNumber: formatForEdit(line.phoneNumber),
      label: line.label || "",
      isActive: line.isActive,
    });
    clearValidationErrors();
    setShowEditModal(true);
  };

  const handleDelete = (line: PhoneLine) => {
    setSelectedLine(line);
    setShowDeleteModal(true);
  };

  const handleSubmitCreate = async () => {
    setValidationErrors({});
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
      fetchLines();
      resetForm();
    } catch (error: any) {
      console.error("Error creating phone line:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create phone line",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedLine) return;
    setValidationErrors({});
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
      fetchLines();
      resetForm();
      setSelectedLine(null);
    } catch (error: any) {
      console.error("Error updating phone line:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update phone line",
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
      fetchLines();
      setSelectedLine(null);
    } catch (error: any) {
      console.error("Error deleting phone line:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete phone line",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Phone Lines</h1>
          <p className="text-muted-foreground">
            Manage allowed Aircall phone lines that generate tickets
          </p>
        </div>

        <PhoneLinesToolbar
          search={search}
          onSearchChange={setSearch}
          onRefresh={fetchLines}
          onCreate={canManage ? handleCreate : undefined}
          canCreate={canManage}
          totalCount={filteredLines.length}
        />

        <PhoneLinesTable
          loading={loading}
          lines={paginatedLines}
          totalFiltered={filteredLines.length}
          onEdit={canManage ? handleEdit : undefined}
          onDelete={canManage ? handleDelete : undefined}
          canManage={canManage}
        />

        <PhoneLinesPagination
          totalCount={filteredLines.length}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={(value) => {
            setItemsPerPage(value);
            setCurrentPage(1);
          }}
          onPageChange={setCurrentPage}
        />
      </div>

      {canManage && (
        <>
          <PhoneLineFormModal
            open={showCreateModal}
            onOpenChange={(open) => {
              setShowCreateModal(open);
              if (!open) clearValidationErrors();
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
              if (!open) clearValidationErrors();
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
            onOpenChange={(open) => {
              setShowDeleteModal(open);
            }}
            phoneNumber={selectedLine?.phoneNumber}
            isSubmitting={isSubmitting}
            onConfirm={handleSubmitDelete}
          />
        </>
      )}
    </>
  );
}
