"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { BarChart3, CheckCircle2, Plus } from "lucide-react";

import { fetchFromBackend } from "@/lib/api-client";
import {
  buildListQueryString,
  usePaginatedList,
} from "@/hooks/use-paginated-list";
import { useRole } from "@/components/providers/role-provider";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Yard, YardFormData } from "./types";
import { YardsToolbar, type YardsFilterState } from "./components/YardsToolbar";
import { YardsTable } from "./components/YardsTable";

const YardFormModal = dynamic(
  () => import("./components/YardFormModal").then((m) => m.YardFormModal),
  { ssr: false },
);
const DeleteYardModal = dynamic(
  () => import("./components/DeleteYardModal").then((m) => m.DeleteYardModal),
  { ssr: false },
);
const YardSheet = dynamic(
  () => import("./components/YardSheet").then((m) => m.YardSheet),
  { ssr: false },
);

const ITEMS_PER_PAGE = 10;

const DEFAULT_FORM: YardFormData = {
  name: "",
  commonName: "",
  propertyAddress: "",
  contactInfo: "",
  yardLink: "",
  notes: "",
  yardType: "SAAS",
  isActive: true,
};

const getYardFormData = (yard: Yard): YardFormData => ({
  name: yard.name,
  commonName: yard.commonName,
  propertyAddress: yard.propertyAddress,
  contactInfo: yard.contactInfo,
  yardLink: yard.yardLink || "",
  notes: yard.notes || "",
  yardType: yard.yardType,
  isActive: yard.isActive,
});

const VIEW_TABS = [
  { key: "all", label: "All Yards" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "saas", label: "SaaS" },
  { key: "full_service", label: "Full Service" },
  { key: "archived", label: "Archived" },
] as const;

type YardView = (typeof VIEW_TABS)[number]["key"];

export default function YardsPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useRole();

  const isAgent = role?.toString().toLowerCase() === "agent";
  const canManage = !isAgent;
  const yardIdParam = searchParams?.get("yardId");
  const landlordIdParam = searchParams?.get("landlordId");
  const yardIdFilter = yardIdParam ? Number(yardIdParam) : null;
  const returnLandlordId = landlordIdParam ? Number(landlordIdParam) : null;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeView, setActiveView] = useState<YardView>("all");
  const [filters, setFilters] = useState<YardsFilterState>({
    type: "all",
    status: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showYardSheet, setShowYardSheet] = useState(false);
  const [selectedYard, setSelectedYard] = useState<Yard | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<YardFormData>(DEFAULT_FORM);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const listQuery = useMemo(() => {
    const qs = buildListQueryString({
      page: currentPage,
      limit: itemsPerPage,
      search: debouncedSearch.trim() || undefined,
      view: activeView !== "all" ? activeView : undefined,
      yardType: filters.type !== "all" ? filters.type : undefined,
      status: filters.status !== "all" ? filters.status : undefined,
      yardId: yardIdFilter ?? undefined,
      includeViewCounts: true,
    });
    return `/yards?${qs}`;
  }, [
    currentPage,
    itemsPerPage,
    debouncedSearch,
    activeView,
    filters,
    yardIdFilter,
  ]);

  const {
    items: yards,
    total: totalFiltered,
    totalPages,
    viewCounts: serverViewCounts,
    isLoading: loading,
    error: listError,
    mutate: refreshYards,
  } = usePaginatedList<Yard>(listQuery);

  useEffect(() => {
    if (listError) {
      toast({
        title: "Error",
        description: "Failed to load yards",
        variant: "destructive",
      });
    }
  }, [listError]);

  useEffect(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowYardSheet(false);
  }, [pathname]);

  useEffect(() => {
    if (!yardIdFilter || loading) return;
    const match = yards.find((y) => y.id === yardIdFilter);
    if (match) {
      setSelectedYard(match);
      setShowYardSheet(true);
      return;
    }
    let cancelled = false;
    fetchFromBackend(`/yards/${yardIdFilter}`)
      .then((yard) => {
        if (!cancelled && yard) {
          setSelectedYard(yard as Yard);
          setShowYardSheet(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [yardIdFilter, loading, yards]);

  const handleYardSheetOpenChange = (open: boolean) => {
    setShowYardSheet(open);
    if (!open) {
      setSelectedYard(null);
      if (yardIdParam || landlordIdParam) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("yardId");
        params.delete("landlordId");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    }
  };

  const returnLandlord = useMemo(() => {
    if (!returnLandlordId || Number.isNaN(returnLandlordId)) return null;

    const yard =
      selectedYard ??
      (yardIdFilter ? yards.find((y) => y.id === yardIdFilter) : undefined);

    if (yard?.landlord?.id === returnLandlordId && yard.landlord.name) {
      return { id: returnLandlordId, name: yard.landlord.name };
    }

    const match = yards.find((y) => y.landlord?.id === returnLandlordId);
    if (match?.landlord?.name) {
      return { id: returnLandlordId, name: match.landlord.name };
    }

    return { id: returnLandlordId, name: `Landlord #${returnLandlordId}` };
  }, [returnLandlordId, selectedYard, yardIdFilter, yards]);

  const viewCounts = useMemo(
    () =>
      serverViewCounts ?? {
        all: 0,
        active: 0,
        inactive: 0,
        saas: 0,
        full_service: 0,
      },
    [serverViewCounts],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters, activeView]);

  const resetForm = () => setFormData(DEFAULT_FORM);

  const handleFilterChange = (key: keyof YardsFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters({ type: "all", status: "all" });
  const clearValidationErrors = () => setValidationErrors({});

  const handleCreate = () => {
    resetForm();
    clearValidationErrors();
    setShowCreateModal(true);
  };

  const handleEdit = (yard: Yard) => {
    setSelectedYard(yard);
    setFormData(getYardFormData(yard));
    clearValidationErrors();
    setShowEditModal(true);
  };

  const handleDelete = (yard: Yard) => {
    setSelectedYard(yard);
    clearValidationErrors();
    setShowDeleteModal(true);
  };

  const handleRestore = async (yard: Yard) => {
    try {
      await fetchFromBackend(`/yards/${yard.id}/restore`, { method: "PATCH" });
      toast({
        title: "Restored",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Yard restored successfully</span>
          </div>
        ),
      });
      await refreshYards();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({ title: "Error", description: err.message || "Failed to restore yard.", variant: "destructive" });
    }
  };

  const handleRowClick = (yard: Yard) => {
    setSelectedYard(yard);
    setShowYardSheet(true);
  };

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.commonName.trim()) errors.commonName = "Common name is required";
    if (!formData.propertyAddress.trim()) errors.propertyAddress = "Address is required";
    if (!formData.contactInfo.trim()) errors.contactInfo = "Contact info is required";
    return errors;
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
      await fetchFromBackend("/yards", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Yard created successfully</span>
          </div>
        ),
      });
      setShowCreateModal(false);
      resetForm();
      await refreshYards();
    } catch (error: unknown) {
      const err = error as { message?: string | Record<string, string> };
      if (err.message && typeof err.message === "object") {
        setValidationErrors(err.message);
      } else {
        toast({
          title: "Error",
          description: (typeof err.message === "string" ? err.message : null) || "Failed to create yard",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedYard) return;
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
      await fetchFromBackend(`/yards/${selectedYard.id}`, {
        method: "PATCH",
        body: JSON.stringify(formData),
      });
      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Yard updated successfully</span>
          </div>
        ),
      });
      setShowEditModal(false);
      setSelectedYard(null);
      resetForm();
      await refreshYards();
    } catch (error: unknown) {
      const err = error as { message?: string | Record<string, string> };
      if (err.message && typeof err.message === "object") {
        setValidationErrors(err.message);
      } else {
        toast({
          title: "Error",
          description: (typeof err.message === "string" ? err.message : null) || "Failed to update yard",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedYard) return;
    try {
      setIsSubmitting(true);
      await fetchFromBackend(`/yards/${selectedYard.id}`, { method: "DELETE" });
      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Yard archived successfully</span>
          </div>
        ),
      });
      setShowDeleteModal(false);
      setSelectedYard(null);
      await refreshYards();
    } catch (error: unknown) {
      const err = error as { message?: string };
      const errorMsg = err.message || "Failed to archive yard.";
      toast({ title: "Error", description: errorMsg, variant: "destructive" });
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
            Yard Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {today} · Manage yards, locations, and assignments
          </p>
        </div>

        {!isAgent && (
          <Button
            asChild
            variant="outline"
            className="h-9 px-4 rounded-xl border-border text-[13px] font-medium shadow-sm hover:bg-[#f0faf5] hover:text-[#008f68] hover:border-[#008f68]/40"
          >
            <Link href="/reports/yards">
              <BarChart3 className="mr-1.5 h-4 w-4" />
              Yard Reports
            </Link>
          </Button>
        )}
      </div>

      <div className="flex border-b border-border mt-1 items-end">
        <div className="flex flex-1 min-w-0 items-end [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex px-0.5">
            {VIEW_TABS.map((tab) => {
              const isActive = activeView === tab.key;
              const count = viewCounts[tab.key] ?? 0;
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
              New Yard
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 mb-2">
        <YardsToolbar
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={clearFilters}
        />
      </div>

      <YardsTable
          loading={loading}
          yards={yards}
          totalFiltered={totalFiltered}
          onRowClick={handleRowClick}
          onEdit={canManage && activeView !== "archived" ? handleEdit : undefined}
          onDelete={canManage && activeView !== "archived" ? handleDelete : undefined}
          onRestore={canManage && activeView === "archived" ? handleRestore : undefined}
          canManage={canManage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          totalPages={totalPages}
        />

      <YardFormModal
        open={showCreateModal}
        onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) clearValidationErrors();
        }}
        title="Create New Yard"
        description="Fill in the details to create a new yard"
        submitLabel="Create Yard"
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
        idPrefix="create"
        showPlaceholders
      />

      <YardFormModal
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) clearValidationErrors();
        }}
        title="Edit Yard"
        description="Modify the yard details"
        submitLabel="Save Changes"
        isSubmitting={isSubmitting}
        formData={formData}
        onFormChange={setFormData}
        validationErrors={validationErrors}
        onValidationErrorChange={setValidationErrors}
        onSubmit={handleSubmitEdit}
        onReset={() => {
          if (selectedYard) setFormData(getYardFormData(selectedYard));
          clearValidationErrors();
        }}
        idPrefix="edit"
      />

      <DeleteYardModal
        open={showDeleteModal}
        onOpenChange={(open) => {
          setShowDeleteModal(open);
          if (!open) clearValidationErrors();
        }}
        yardName={selectedYard?.name}
        isSubmitting={isSubmitting}
        onConfirm={handleSubmitDelete}
      />

      <YardSheet
        open={showYardSheet}
        onOpenChange={handleYardSheetOpenChange}
        yard={selectedYard}
        onEdit={canManage && activeView !== "archived" ? handleEdit : undefined}
        onDelete={canManage && activeView !== "archived" ? handleDelete : undefined}
        returnLandlord={returnLandlord}
      />

    </div>
  );
}
