"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { BarChart3, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/components/providers/role-provider";
import { fetchFromBackend } from "@/lib/api-client";
import {
  buildListQueryString,
  usePaginatedList,
} from "@/hooks/use-paginated-list";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ManagementType } from "../calls/types";
import type { Campaign, CampaignFormData, YardSummary } from "./types";
import {
  CampaignsToolbar,
  type CampaignsFilterState,
} from "./components/CampaignsToolbar";
import { CampaignsGrid } from "./components/CampaignsGrid";
import { CampaignsPagination } from "./components/CampaignsPagination";

const CampaignFormModal = dynamic(
  () => import("./components/CampaignFormModal").then((m) => m.CampaignFormModal),
  { ssr: false },
);
const DeleteCampaignModal = dynamic(
  () =>
    import("./components/DeleteCampaignModal").then((m) => m.DeleteCampaignModal),
  { ssr: false },
);
const CampaignSheet = dynamic(
  () => import("./components/CampaignSheet").then((m) => m.CampaignSheet),
  { ssr: false },
);

const DEFAULT_FORM: CampaignFormData = {
  nombre: "",
  yardaId: undefined,
  duracion: "",
  tipo: ManagementType.ONBOARDING,
  isActive: true,
};

const VIEW_TABS = [
  { key: "all", label: "All Campaigns" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "onboarding", label: "Onboarding" },
  { key: "ar", label: "AR" },
  { key: "archived", label: "Archived" },
] as const;

const DEFAULT_FILTERS: CampaignsFilterState = {
  type: "all",
  status: "all",
};

type CampaignView = (typeof VIEW_TABS)[number]["key"];

export default function CampaignsPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useRole();

  const isAgent = role?.toString().toLowerCase() === "agent";
  const canManage = !isAgent;

  const campaignIdParam = searchParams?.get("campaignId");
  const campaignIdFilter = campaignIdParam ? Number(campaignIdParam) : null;
  const yardPanelParam = searchParams?.get("yardPanel");
  const yardPanelId =
    yardPanelParam && !Number.isNaN(Number(yardPanelParam))
      ? Number(yardPanelParam)
      : null;

  const replaceCampaignSearch = (
    patch: Record<string, string | null | undefined>,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const [yards, setYards] = useState<YardSummary[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [yardFilter, setYardFilter] = useState("all");
  const [filters, setFilters] = useState<CampaignsFilterState>(DEFAULT_FILTERS);
  const [activeView, setActiveView] = useState<CampaignView>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCampaignSheet, setShowCampaignSheet] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

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
      tipo: filters.type !== "all" ? filters.type : undefined,
      status: filters.status !== "all" ? filters.status : undefined,
      yardId: yardFilter !== "all" ? Number(yardFilter) : undefined,
      campaignId: campaignIdFilter ?? undefined,
      includeViewCounts: true,
    });
    return `/campaign?${qs}`;
  }, [
    currentPage,
    itemsPerPage,
    debouncedSearch,
    activeView,
    filters,
    yardFilter,
    campaignIdFilter,
  ]);

  const {
    items: campaigns,
    total: totalFiltered,
    totalPages,
    viewCounts: serverViewCounts,
    isLoading: loading,
    error: listError,
    mutate: refreshCampaigns,
  } = usePaginatedList<Campaign>(listQuery);

  useEffect(() => {
    if (listError) {
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    }
  }, [listError]);

  const fetchYards = async () => {
    try {
      const data = await fetchFromBackend("/yards?page=1&limit=500");
      const items = Array.isArray(data) ? data : data?.data || [];
      setYards(items);
    } catch {
      // Yards are optional for display; failures are non-blocking
    }
  };

  useEffect(() => {
    fetchYards();
  }, []);

  useEffect(() => {
    setShowCreate(false);
    setShowEdit(false);
    setShowDelete(false);
    setShowCampaignSheet(false);
  }, [pathname]);

  useEffect(() => {
    if (!campaignIdFilter || loading) return;
    const match = campaigns.find((c) => c.id === campaignIdFilter);
    if (match) {
      setSelectedCampaign(match);
      setShowCampaignSheet(true);
      return;
    }
    let cancelled = false;
    fetchFromBackend(`/campaign/${campaignIdFilter}`)
      .then((campaign) => {
        if (!cancelled && campaign) {
          setSelectedCampaign(campaign as Campaign);
          setShowCampaignSheet(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [campaignIdFilter, loading, campaigns]);

  const handleOpenYardPanel = (yardId: number) => {
    if (!selectedCampaign?.id) return;
    setShowCampaignSheet(true);
    replaceCampaignSearch({
      campaignId: String(selectedCampaign.id),
      yardPanel: String(yardId),
    });
  };

  const handleCloseYardPanel = () => {
    replaceCampaignSearch({ yardPanel: null });
  };

  const handleCampaignSheetOpenChange = (open: boolean) => {
    setShowCampaignSheet(open);
    if (!open) {
      setSelectedCampaign(null);
      if (campaignIdParam || yardPanelParam) {
        replaceCampaignSearch({ campaignId: null, yardPanel: null });
      }
    }
  };

  const getYardName = (campaign: Campaign) =>
    campaign.yarda?.name ||
    yards.find((y) => y.id === campaign.yardaId)?.name ||
    "";

  const viewCounts = useMemo(
    () =>
      serverViewCounts ?? {
        all: 0,
        active: 0,
        inactive: 0,
        onboarding: 0,
        ar: 0,
      },
    [serverViewCounts],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, yardFilter, filters, activeView, itemsPerPage]);

  const handleFilterChange = (
    key: keyof CampaignsFilterState,
    value: string,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setFormData(DEFAULT_FORM);
  const clearValidationErrors = () => setValidationErrors({});

  const buildPayload = (data: CampaignFormData) => ({
    ...data,
    yardaId: data.yardaId ?? undefined,
    duracion: data.duracion.trim() ? data.duracion.trim() : undefined,
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.nombre.trim()) errors.nombre = "Please enter the campaign name.";
    if (!formData.tipo) errors.tipo = "Please select a campaign type.";
    return errors;
  };

  const handleCreate = () => {
    resetForm();
    clearValidationErrors();
    setShowCreate(true);
  };

  const handleOpen = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowCampaignSheet(true);
  };

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      nombre: campaign.nombre,
      yardaId: campaign.yardaId ?? undefined,
      duracion: campaign.duracion ?? "",
      tipo: campaign.tipo,
      isActive: campaign.isActive,
    });
    clearValidationErrors();
    setShowEdit(true);
  };

  const handleRestore = async (campaign: Campaign) => {
    try {
      await fetchFromBackend(`/campaign/${campaign.id}/restore`, { method: "PATCH" });
      toast({
        title: "Restored",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Campaign restored successfully</span>
          </div>
        ),
      });
      await refreshCampaigns();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({ title: "Error", description: err.message || "Failed to restore campaign.", variant: "destructive" });
    }
  };

  const handleDelete = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDelete(true);
  };

  const handleSubmitCreate = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Missing fields",
        description: "Please review the form.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await fetchFromBackend("/campaign", {
        method: "POST",
        body: JSON.stringify(buildPayload(formData)),
      });
      toast({
        title: "Saved",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Campaign created successfully</span>
          </div>
        ),
      });
      setShowCreate(false);
      resetForm();
      await refreshCampaigns();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedCampaign) return;
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Missing fields",
        description: "Please review the form.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await fetchFromBackend(`/campaign/${selectedCampaign.id}`, {
        method: "PATCH",
        body: JSON.stringify(buildPayload(formData)),
      });
      toast({
        title: "Saved",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Campaign updated successfully</span>
          </div>
        ),
      });
      setShowEdit(false);
      setSelectedCampaign(null);
      resetForm();
      await refreshCampaigns();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to update campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedCampaign) return;
    try {
      setIsSubmitting(true);
      await fetchFromBackend(`/campaign/${selectedCampaign.id}`, {
        method: "DELETE",
      });
      toast({
        title: "Archived",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Campaign archived successfully</span>
          </div>
        ),
      });
      setShowDelete(false);
      setShowCampaignSheet(false);
      setSelectedCampaign(null);
      await refreshCampaigns();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to delete campaign",
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
    <div className="flex h-screen flex-col gap-0 px-4 pb-4 pt-2">
      <div className="flex w-full flex-col justify-between gap-3 border-b border-border px-0.5 pb-5 pt-2 md:flex-row md:items-center">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-neutral-50">
            Campaigns
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            {today} · Track initiatives, yards, and ticket performance
          </p>
        </div>

        {!isAgent && (
          <Button
            asChild
            variant="outline"
            className="h-9 rounded-xl border-border px-4 text-[13px] font-medium shadow-sm hover:border-[#008f68]/40 hover:bg-[#f0faf5] hover:text-[#008f68]"
          >
            <Link href="/reports/campaigns">
              <BarChart3 className="mr-1.5 h-4 w-4" />
              Campaign Reports
            </Link>
          </Button>
        )}
      </div>

      <div className="mt-1 flex items-end border-b border-border">
        <div className="flex min-w-0 flex-1 items-end   [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                    "-mb-px mr-4 flex items-center gap-2 whitespace-nowrap border-b-2 px-2 py-2.5 text-[13px] font-medium transition-colors",
                    isActive
                      ? "border-[#008f68] text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-full border px-1.5 py-px text-[11px]",
                      isActive
                        ? "border-emerald-600/15 bg-emerald-600/10 font-semibold text-[#008f68] dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300"
                        : "border-border bg-muted/40 font-medium text-muted-foreground",
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
          <div className="shrink-0 pb-2 pl-4 pr-2 pt-0.5">
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
              <Plus className="h-3.5 w-3.5" />
              New Campaign
            </button>
          </div>
        )}
      </div>

      <div className="mb-2 mt-3">
        <CampaignsToolbar
          search={search}
          onSearchChange={setSearch}
          yardFilter={yardFilter}
          onYardFilterChange={setYardFilter}
          filters={filters}
          onFilterChange={handleFilterChange}
          yards={yards}
          onClearFilters={() => {
            setSearch("");
            setYardFilter("all");
            setFilters(DEFAULT_FILTERS);
          }}
        />
      </div>

      <div className="flex flex-col gap-4">
        <CampaignsGrid
          loading={loading}
          campaigns={campaigns}
          yards={yards}
          totalFiltered={totalFiltered}
          search={search}
          canManage={canManage}
          onCreate={handleCreate}
          onOpen={handleOpen}
          onEdit={canManage && activeView !== "archived" ? handleEdit : undefined}
          onDelete={canManage && activeView !== "archived" ? handleDelete : undefined}
          onRestore={canManage && activeView === "archived" ? handleRestore : undefined}
        />

        <CampaignsPagination
          totalCount={totalFiltered}
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
          <CampaignFormModal
            open={showCreate}
            mode="create"
            onOpenChange={(open) => {
              setShowCreate(open);
              if (!open) clearValidationErrors();
            }}
            title="Create campaign"
            description="Add a new initiative linked to a yard and type."
            submitLabel="Create campaign"
            isSubmitting={isSubmitting}
            formData={formData}
            onFormChange={setFormData}
            validationErrors={validationErrors}
            onValidationErrorChange={setValidationErrors}
            onSubmit={handleSubmitCreate}
            idPrefix="create"
            yards={yards}
          />

          <CampaignFormModal
            open={showEdit}
            mode="edit"
            onOpenChange={(open) => {
              setShowEdit(open);
              if (!open) clearValidationErrors();
            }}
            title="Edit campaign"
            description={
              selectedCampaign
                ? `Update settings for ${selectedCampaign.nombre}`
                : "Update campaign details"
            }
            submitLabel="Save changes"
            isSubmitting={isSubmitting}
            formData={formData}
            onFormChange={setFormData}
            validationErrors={validationErrors}
            onValidationErrorChange={setValidationErrors}
            onSubmit={handleSubmitEdit}
            idPrefix="edit"
            yards={yards}
          />

          <DeleteCampaignModal
            open={showDelete}
            onOpenChange={setShowDelete}
            campaignName={selectedCampaign?.nombre}
            isSubmitting={isSubmitting}
            onConfirm={handleSubmitDelete}
          />
        </>
      )}

      <CampaignSheet
        open={showCampaignSheet}
        onOpenChange={handleCampaignSheetOpenChange}
        campaign={selectedCampaign}
        yards={yards}
        yardPanelId={yardPanelId}
        onOpenYardPanel={handleOpenYardPanel}
        onCloseYardPanel={handleCloseYardPanel}
        onEdit={canManage && activeView !== "archived" ? handleEdit : undefined}
        onDelete={canManage && activeView !== "archived" ? handleDelete : undefined}
      />
    </div>
  );
}
