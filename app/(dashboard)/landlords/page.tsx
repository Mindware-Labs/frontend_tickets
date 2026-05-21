"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { BarChart3, CheckCircle2, Plus } from "lucide-react";

import { fetchFromBackend } from "@/lib/api-client";
import { useRole } from "@/components/providers/role-provider";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Landlord, LandlordFormData, YardOption } from "./types";
import { LandlordsToolbar } from "./components/LandlordsToolbar";
import { LandlordsTable } from "./components/LandlordsTable";

const LandlordFormModal = dynamic(
  () => import("./components/LandlordFormModal").then((m) => m.LandlordFormModal),
  { ssr: false },
);
const DeleteLandlordModal = dynamic(
  () => import("./components/DeleteLandlordModal").then((m) => m.DeleteLandlordModal),
  { ssr: false },
);
const LandlordSheet = dynamic(
  () => import("./components/LandlordSheet").then((m) => m.LandlordSheet),
  { ssr: false },
);

const ITEMS_PER_PAGE = 10;

const DEFAULT_FORM: LandlordFormData = {
  name: "",
  phone: "",
  email: "",
  yardIds: [],
};

const getLandlordFormData = (landlord: Landlord): LandlordFormData => ({
  name: landlord.name ?? "",
  phone: landlord.phone ?? "",
  email: landlord.email ?? "",
  yardIds: landlord.yards?.map((y) => y.id.toString()) ?? [],
});

export default function LandlordsPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useRole();

  const isAgent = role?.toString().toLowerCase() === "agent";
  const canManage = !isAgent;
  const landlordIdParam = searchParams?.get("landlordId");
  const landlordIdFilter = landlordIdParam ? Number(landlordIdParam) : null;

  const [landlords, setLandlords] = useState<Landlord[]>([]);
  const [yards, setYards] = useState<YardOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLandlordSheet, setShowLandlordSheet] = useState(false);
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
    setShowLandlordSheet(false);
  }, [pathname]);

  useEffect(() => {
    if (!landlordIdFilter || loading || landlords.length === 0) return;
    const match = landlords.find((l) => l.id === landlordIdFilter);
    if (match) {
      setSelectedLandlord(match);
      setShowLandlordSheet(true);
    }
  }, [landlordIdFilter, loading, landlords.length]);

  const handleLandlordSheetOpenChange = (open: boolean) => {
    setShowLandlordSheet(open);
    if (!open) {
      setSelectedLandlord(null);
      if (landlordIdParam) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("landlordId");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    }
  };

  const filteredLandlords = useMemo(() => {
    const term = search.toLowerCase();
    return landlords
      .filter((l) => {
        if (landlordIdFilter && l.id !== landlordIdFilter) return false;
        if (!term) return true;
        const name = l.name?.toLowerCase() ?? "";
        const email = l.email?.toLowerCase() ?? "";
        const phone = l.phone?.toLowerCase() ?? "";
        const yardNames =
          l.yards?.map((y) => y.name).join(" ").toLowerCase() ?? "";
        return (
          name.includes(term) ||
          email.includes(term) ||
          phone.includes(term) ||
          yardNames.includes(term)
        );
      })
      .sort((a, b) => a.id - b.id);
  }, [landlords, search, landlordIdFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredLandlords.length / ITEMS_PER_PAGE),
  );

  const paginatedLandlords = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLandlords.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLandlords, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, landlordIdFilter]);

  const resetForm = () => setFormData(DEFAULT_FORM);
  const clearValidationErrors = () => setValidationErrors({});

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.phone.trim()) errors.phone = "Phone is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (formData.yardIds.length === 0)
      errors.yardIds = "Select at least one yard";
    return errors;
  };

  const buildPayload = (data: LandlordFormData) => ({
    name: data.name.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    yardIds: data.yardIds.map(Number),
  });

  const handleCreate = () => {
    resetForm();
    clearValidationErrors();
    setShowCreateModal(true);
  };

  const handleEdit = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setFormData(getLandlordFormData(landlord));
    clearValidationErrors();
    setShowEditModal(true);
  };

  const handleDelete = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    clearValidationErrors();
    setShowDeleteModal(true);
  };

  const handleRowClick = (landlord: Landlord) => {
    setSelectedLandlord(landlord);
    setShowLandlordSheet(true);
  };

  const handleSubmitCreate = async () => {
    clearValidationErrors();
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
      resetForm();
      await fetchLandlords();
      await fetchYards();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message ?? "Failed to create landlord",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedLandlord) return;
    clearValidationErrors();
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
      setSelectedLandlord(null);
      resetForm();
      await fetchLandlords();
      await fetchYards();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message ?? "Failed to update landlord",
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
      setSelectedLandlord(null);
      await fetchLandlords();
      await fetchYards();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message ?? "Failed to delete landlord",
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

  const availableYardsForCreate = yards.filter((y) => !y.landlord?.id);
  const availableYardsForEdit = yards.filter(
    (y) =>
      !y.landlord?.id ||
      (selectedLandlord && y.landlord?.id === selectedLandlord.id),
  );

  const selectedYardCount =
    selectedLandlord?.yards?.length ??
    yards.filter((y) => y.landlord?.id === selectedLandlord?.id).length;

  return (
    <div className="h-screen flex flex-col px-4 pt-2 pb-4 gap-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between w-full pt-2 pb-5 px-0.5 gap-3 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
            Landlord Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {today} · Manage landlords and yard assignments
          </p>
        </div>

        {!isAgent && (
          <Button
            asChild
            variant="outline"
            className="h-9 px-4 rounded-xl border-border text-[13px] font-medium shadow-sm hover:bg-[#f0faf5] hover:text-[#008f68] hover:border-[#008f68]/40"
          >
            <Link href="/reports/landlords">
              <BarChart3 className="mr-1.5 h-4 w-4" />
              Landlord Reports
            </Link>
          </Button>
        )}
      </div>

      <div className="flex border-b border-border mt-1 items-end">
        <div className="flex flex-1 min-w-0 items-end overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex px-0.5">
            <div className="px-2 py-2.5 text-[13px] font-medium border-b-2 border-[#008f68] text-foreground -mb-px mr-4 flex items-center gap-2 whitespace-nowrap">
              All Landlords
              <span className="py-px px-1.5 rounded-full text-[11px] border bg-[#e2fae9] text-[#008f68] font-semibold border-[#e2fae9]">
                {filteredLandlords.length}
              </span>
            </div>
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
              New Landlord
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 mb-2">
        <LandlordsToolbar search={search} onSearchChange={setSearch} />
      </div>

      <div className="flex-1 min-h-0">
        <LandlordsTable
          loading={loading}
          landlords={paginatedLandlords}
          totalFiltered={filteredLandlords.length}
          yards={yards}
          onRowClick={handleRowClick}
          onEdit={canManage ? handleEdit : undefined}
          onDelete={canManage ? handleDelete : undefined}
          canManage={canManage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          totalPages={totalPages}
        />
      </div>

      <LandlordFormModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) clearValidationErrors();
        }}
        title="Create New Landlord"
        description="Fill in the details to create a new landlord"
        submitLabel="Create Landlord"
        isSubmitting={isSubmitting}
        formData={formData}
        onFormChange={setFormData}
        validationErrors={validationErrors}
        onValidationErrorChange={setValidationErrors}
        onSubmit={handleSubmitCreate}
        onReset={() => {
          resetForm();
          clearValidationErrors();
        }}
        yards={availableYardsForCreate}
        idPrefix="create"
        showPlaceholders
      />

      <LandlordFormModal
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) clearValidationErrors();
        }}
        title="Edit Landlord"
        description="Modify the landlord details"
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        formData={formData}
        onFormChange={setFormData}
        validationErrors={validationErrors}
        onValidationErrorChange={setValidationErrors}
        onSubmit={handleSubmitEdit}
        onReset={() => {
          if (selectedLandlord) setFormData(getLandlordFormData(selectedLandlord));
          clearValidationErrors();
        }}
        yards={availableYardsForEdit}
        idPrefix="edit"
      />

      <DeleteLandlordModal
        open={showDeleteModal}
        onOpenChange={(open) => {
          setShowDeleteModal(open);
          if (!open) clearValidationErrors();
        }}
        landlordName={selectedLandlord?.name}
        yardCount={selectedYardCount}
        isSubmitting={isSubmitting}
        onConfirm={handleSubmitDelete}
      />

      <LandlordSheet
        open={showLandlordSheet}
        onOpenChange={handleLandlordSheetOpenChange}
        landlord={selectedLandlord}
        yards={yards}
        onEdit={canManage ? handleEdit : undefined}
      />
    </div>
  );
}
