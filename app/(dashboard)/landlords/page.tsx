"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { CheckCircle2, Plus } from "lucide-react";

import { fetchFromBackend } from "@/lib/api-client";
import { useRole } from "@/components/providers/role-provider";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

import { Landlord, LandlordFormData, YardOption } from "./types";
import { LandlordsToolbar } from "./components/LandlordsToolbar";
import { LandlordsTable } from "./components/LandlordsTable";
import { LandlordDrawer } from "./components/LandlordDrawer";

const LandlordFormModal = dynamic(
  () => import("./components/LandlordFormModal").then((m) => m.LandlordFormModal),
  { ssr: false },
);
const DeleteLandlordModal = dynamic(
  () => import("./components/DeleteLandlordModal").then((m) => m.DeleteLandlordModal),
  { ssr: false },
);

const ITEMS_PER_PAGE = 10;

const DEFAULT_FORM: LandlordFormData = {
  name: "",
  phone: "",
  email: "",
  yardIds: [],
};

export default function LandlordsPage() {
  const { role } = useRole();
  const pathname = usePathname();

  const isAgent = role?.toString().toLowerCase() === "agent";
  const canManage = !isAgent;

  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [yards, setYards] = useState<YardOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLandlords, setSelectedLandlords] = useState<number[]>([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedLandlord, setSelectedLandlord] = useState<Landlord | null>(null);

  const [formData, setFormData] = useState<LandlordFormData>(DEFAULT_FORM);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLandlords = async () => {
    try {
      setLoading(true);
      const data = await fetchFromBackend("/landlords?page=1&limit=500");
      setLandlords(Array.isArray(data) ? data : (data?.data ?? []));
    } catch {
      toast({ title: "Error", description: "Failed to load landlords", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchYards = async () => {
    try {
      const data = await fetchFromBackend("/yards?page=1&limit=10000");
      setYards(Array.isArray(data) ? data : (data?.data ?? []));
    } catch {
      console.error("Failed to load yards");
    }
  };

  useEffect(() => {
    fetchLandlords();
    fetchYards();
  }, []);

  useEffect(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDrawer(false);
  }, [pathname]);

  const filteredLandlords = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return landlords;
    return landlords.filter((l) => {
      const name = l.name?.toLowerCase() ?? "";
      const email = l.email?.toLowerCase() ?? "";
      const phone = l.phone?.toLowerCase() ?? "";
      const yardNames = l.yards?.map((y) => y.name).join(" ").toLowerCase() ?? "";
      return name.includes(term) || email.includes(term) || phone.includes(term) || yardNames.includes(term);
    });
  }, [landlords, search]);

  const totalPages = Math.ceil(filteredLandlords.length / ITEMS_PER_PAGE);

  const paginatedLandlords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLandlords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLandlords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedLandlords([]);
  }, [search]);

  const resetForm = () => setFormData(DEFAULT_FORM);
  const clearErrors = () => setValidationErrors({});

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.phone.trim()) errors.phone = "Phone is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (formData.yardIds.length === 0) errors.yardIds = "Select at least one yard";
    return errors;
  };

  const buildPayload = (data: LandlordFormData) => ({
    name: data.name.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    yardIds: data.yardIds.map(Number),
  });

  const openDrawer = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setShowDrawer(true);
  };

  const handleCreate = () => {
    resetForm();
    clearErrors();
    setShowCreateModal(true);
  };

  const handleEdit = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setFormData({
      name: landlord.name ?? "",
      phone: landlord.phone ?? "",
      email: landlord.email ?? "",
      yardIds: landlord.yards?.map((y) => y.id.toString()) ?? [],
    });
    clearErrors();
    setShowEditModal(true);
  };

  const handleDelete = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    clearErrors();
    setShowDeleteModal(true);
  };

  const handleSubmitCreate = async () => {
    clearErrors();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
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
      resetForm();
      await fetchLandlords();
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Failed to create landlord", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedLandlord) return;
    clearErrors();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
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
      setSelectedLandlord(null);
      resetForm();
      await fetchLandlords();
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Failed to update landlord", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedLandlord) return;
    try {
      setIsSubmitting(true);
      await fetchFromBackend(`/landlords/${selectedLandlord.id}`, { method: "DELETE" });
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
      setSelectedLandlord(null);
      await fetchLandlords();
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Failed to delete landlord", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const availableYardsForCreate = yards.filter((y) => !y.landlord?.id);
  const availableYardsForEdit = yards.filter(
    (y) => !y.landlord?.id || (selectedLandlord && y.landlord?.id === selectedLandlord.id),
  );

  return (
    <div className="h-screen flex flex-col px-4 pt-4 pb-4 gap-0">

      <div className="flex flex-col md:flex-row md:items-center justify-between w-full py-5 px-0.5 gap-3 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
            Landlord Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{today}</p>
        </div>

        {canManage && (
          <Button
            onClick={handleCreate}
            className="h-9 px-4 rounded-xl bg-[#008f68] hover:bg-[#007a5a] text-white text-[13px] font-medium shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Landlord
          </Button>
        )}
      </div>

      <div className="mt-3 mb-2">
        <LandlordsToolbar
          search={search}
          onSearchChange={setSearch}
          onRefresh={fetchLandlords}
          onCreate={canManage ? handleCreate : undefined}
          canCreate={false}
          totalCount={filteredLandlords.length}
          selectedCount={selectedLandlords.length}
          onClearSelection={() => setSelectedLandlords([])}
        />
      </div>

      <div className="flex-1 min-h-0">
        <LandlordsTable
          loading={loading}
          landlords={paginatedLandlords}
          totalFiltered={filteredLandlords.length}
          yards={yards}
          selectedLandlords={selectedLandlords}
          onSelectionChange={setSelectedLandlords}
          onDetails={openDrawer}
          onEdit={canManage ? handleEdit : undefined}
          onDelete={canManage ? handleDelete : undefined}
          canManage={canManage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          totalPages={totalPages}
        />
      </div>

      <LandlordDrawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
        landlord={selectedLandlord}
        yards={yards}
      />

      {canManage && (
        <>
          <LandlordFormModal
            open={showCreateModal}
            onOpenChange={(open) => { setShowCreateModal(open); if (!open) clearErrors(); }}
            title="Create New Landlord"
            description="Fill in the details to create a landlord"
            submitLabel="Create Landlord"
            isSubmitting={isSubmitting}
            formData={formData}
            onFormChange={setFormData}
            validationErrors={validationErrors}
            onValidationErrorChange={setValidationErrors}
            onSubmit={handleSubmitCreate}
            yards={availableYardsForCreate}
            idPrefix="create"
          />

          <LandlordFormModal
            open={showEditModal}
            onOpenChange={(open) => { setShowEditModal(open); if (!open) clearErrors(); }}
            title="Edit Landlord"
            description="Update landlord details"
            submitLabel="Save Changes"
            isSubmitting={isSubmitting}
            formData={formData}
            onFormChange={setFormData}
            validationErrors={validationErrors}
            onValidationErrorChange={setValidationErrors}
            onSubmit={handleSubmitEdit}
            yards={availableYardsForEdit}
            idPrefix="edit"
          />

          <DeleteLandlordModal
            open={showDeleteModal}
            onOpenChange={(open) => { setShowDeleteModal(open); if (!open) clearErrors(); }}
            landlordName={selectedLandlord?.name}
            isSubmitting={isSubmitting}
            onConfirm={handleSubmitDelete}
          />
        </>
      )}
    </div>
  );
}
