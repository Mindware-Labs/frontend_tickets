"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useRole } from "@/components/providers/role-provider";
import { fetchFromBackend } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { Landlord, LandlordFormData, YardOption } from "./types";
import { LandlordsToolbar } from "./components/LandlordsToolbar";
import { LandlordsTable } from "./components/LandlordsTable";
import { LandlordsPagination } from "./components/LandlordsPagination";
import { LandlordFormModal } from "./components/LandlordFormModal";
import { DeleteLandlordModal } from "./components/DeleteLandlordModal";
import { LandlordDetailsModal } from "./components/LandlordDetailsModal";

const DEFAULT_FORM: LandlordFormData = {
  name: "",
  phone: "",
  email: "",
  yardIds: [],
};

export default function LandlordsPage() {
  const { role } = useRole();
  const normalizedRole = role?.toString().toLowerCase();
  const isAgent = normalizedRole === "agent";
  const canManage = !isAgent;

  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [yards, setYards] = useState<YardOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLandlord, setSelectedLandlord] = useState<Landlord | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [formData, setFormData] = useState<LandlordFormData>(DEFAULT_FORM);

  const fetchLandlords = async () => {
    try {
      setLoading(true);
      const data = await fetchFromBackend("/landlords?page=1&limit=500");
      const items = Array.isArray(data) ? data : data?.data || [];
      setLandlords(items);
    } catch (error) {
      console.error("Error fetching landlords:", error);
      toast({
        title: "Error",
        description: "Failed to load landlords",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchYards = async () => {
    try {
      const data = await fetchFromBackend("/yards?page=1&limit=10000");
      const items = Array.isArray(data) ? data : data?.data || [];
      setYards(items);
    } catch (error) {
      console.error("Error fetching yards:", error);
    }
  };

  useEffect(() => {
    fetchLandlords();
    fetchYards();
  }, []);

  // Close all modals when route changes
  const pathname = usePathname();
  useEffect(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDetailsModal(false);
  }, [pathname]);

  const filteredLandlords = useMemo(() => {
    const term = search.toLowerCase();
    return landlords.filter((landlord) => {
      const name = landlord.name.toLowerCase();
      const email = landlord.email.toLowerCase();
      const phone = landlord.phone.toLowerCase();
      const yardNames = landlord.yards?.map((yard) => yard.name) || [];
      const fallbackYards = yards
        .filter((yard) => yard.landlord?.id === landlord.id)
        .map((yard) => yard.name);
      const yardMatch = [...yardNames, ...fallbackYards]
        .join(" ")
        .toLowerCase();
      return (
        name.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        yardMatch.includes(term)
      );
    });
  }, [landlords, search, yards]);

  const totalPages = Math.ceil(filteredLandlords.length / itemsPerPage);
  const paginatedLandlords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLandlords.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLandlords, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const resetForm = () => setFormData(DEFAULT_FORM);
  const clearValidationErrors = () => setValidationErrors({});

  const handleCreate = () => {
    resetForm();
    clearValidationErrors();
    setShowCreateModal(true);
  };

  const handleEdit = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setFormData({
      name: landlord.name,
      phone: landlord.phone,
      email: landlord.email,
      yardIds:
        landlord.yards?.map((yard) => yard.id.toString()) ||
        yards
          .filter((yard) => yard.landlord?.id === landlord.id)
          .map((yard) => yard.id.toString()),
    });
    clearValidationErrors();
    setShowEditModal(true);
  };

  const handleDelete = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    clearValidationErrors();
    setShowDeleteModal(true);
  };

  const handleDetails = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setShowDetailsModal(true);
  };

  const buildPayload = (data: LandlordFormData) => ({
    name: data.name.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    yardIds: data.yardIds.map((id) => Number(id)),
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.phone.trim()) errors.phone = "Phone is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (formData.yardIds.length === 0)
      errors.yardIds = "Select at least one yard";
    return errors;
  };

  const handleSubmitCreate = async () => {
    setValidationErrors({});
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await fetchFromBackend("/landlords", {
        method: "POST",
        body: JSON.stringify(buildPayload(formData)),
      });

      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Landlord created successfully</span>
          </div>
        ),
      });

      setShowCreateModal(false);
      fetchLandlords();
      resetForm();
    } catch (error: any) {
      console.error("Error creating landlord:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create landlord",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedLandlord) return;
    setValidationErrors({});
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await fetchFromBackend(`/landlords/${selectedLandlord.id}`, {
        method: "PATCH",
        body: JSON.stringify(buildPayload(formData)),
      });

      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Landlord updated successfully</span>
          </div>
        ),
      });

      setShowEditModal(false);
      fetchLandlords();
      resetForm();
      setSelectedLandlord(null);
    } catch (error: any) {
      console.error("Error updating landlord:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update landlord",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedLandlord) return;

    try {
      setIsSubmitting(true);
      await fetchFromBackend(`/landlords/${selectedLandlord.id}`, {
        method: "DELETE",
      });

      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Landlord deleted successfully</span>
          </div>
        ),
      });

      setShowDeleteModal(false);
      fetchLandlords();
      setSelectedLandlord(null);
    } catch (error: any) {
      console.error("Error deleting landlord:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete landlord",
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
          <h1 className="text-3xl font-bold tracking-tight">Landlords</h1>
          <p className="text-muted-foreground">
            Manage landlords linked to yards
          </p>
        </div>

        <LandlordsToolbar
          search={search}
          onSearchChange={setSearch}
          onRefresh={fetchLandlords}
          onCreate={canManage ? handleCreate : undefined}
          canCreate={canManage}
          totalCount={filteredLandlords.length}
        />

        <LandlordsTable
          loading={loading}
          landlords={paginatedLandlords}
          totalFiltered={filteredLandlords.length}
          yards={yards}
          onDetails={handleDetails}
          onEdit={canManage ? handleEdit : undefined}
          onDelete={canManage ? handleDelete : undefined}
          canManage={canManage}
        />

        <LandlordsPagination
          totalCount={filteredLandlords.length}
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
          <LandlordFormModal
            open={showCreateModal}
            onOpenChange={(open) => {
              setShowCreateModal(open);
              if (!open) clearValidationErrors();
            }}
            title="Create New Landlord"
            description="Fill in the details to create a landlord"
            submitLabel="Create Landlord"
            isSubmitting={isSubmitting}
            formData={formData}
            onFormChange={setFormData}
            validationErrors={validationErrors}
            onValidationErrorChange={setValidationErrors}
            onSubmit={handleSubmitCreate}
            yards={yards.filter((yard) => !yard.landlord?.id)}
            idPrefix="create"
          />

          <LandlordFormModal
            open={showEditModal}
            onOpenChange={(open) => {
              setShowEditModal(open);
              if (!open) clearValidationErrors();
            }}
            title="Edit Landlord"
            description="Update landlord details"
            submitLabel="Save Changes"
            isSubmitting={isSubmitting}
            formData={formData}
            onFormChange={setFormData}
            validationErrors={validationErrors}
            onValidationErrorChange={setValidationErrors}
            onSubmit={handleSubmitEdit}
            yards={yards.filter(
              (yard) =>
                !yard.landlord?.id ||
                (selectedLandlord && yard.landlord.id === selectedLandlord.id)
            )}
            idPrefix="edit"
          />

          <DeleteLandlordModal
            open={showDeleteModal}
            onOpenChange={(open) => {
              setShowDeleteModal(open);
              if (!open) clearValidationErrors();
            }}
            landlordName={selectedLandlord?.name}
            isSubmitting={isSubmitting}
            onConfirm={handleSubmitDelete}
          />
        </>
      )}

      <LandlordDetailsModal
        open={showDetailsModal}
        onOpenChange={(open) => setShowDetailsModal(open)}
        landlord={selectedLandlord}
        yards={yards}
      />
    </>
  );
}
