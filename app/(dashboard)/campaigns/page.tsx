"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { BarChart3, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRole } from "@/components/providers/role-provider";
import { fetchFromBackend } from "@/lib/api-client";
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

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [yards, setYards] = useState<YardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await fetchFromBackend("/campaign?page=1&limit=500");
      const items = Array.isArray(data) ? data : data?.data || [];
      setCampaigns(items);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load campaigns",
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
    } catch {
      // Yards are optional for display; failures are non-blocking
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchYards();
  }, []);

  useEffect(() => {
    setShowCreate(false);
    setShowEdit(false);
    setShowDelete(false);
    setShowCampaignSheet(false);
  }, [pathname]);

  useEffect(() => {
    if (!campaignIdFilter || loading || campaigns.length === 0) return;
    const match = campaigns.find((c) => c.id === campaignIdFilter);
    if (match) {
      setSelectedCampaign(match);
      setShowCampaignSheet(true);
    }
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

  const matchesSearch = (campaign: Campaign) => {
    const term = search.toLowerCase();
    if (!term) return true;
    return (
      campaign.nombre.toLowerCase().includes(term) ||
      getYardName(campaign).toLowerCase().includes(term)
    );
  };

  const matchesYard = (campaign: Campaign) =>
    yardFilter === "all" ||
    campaign.yardaId?.toString() === yardFilter ||
    campaign.yarda?.id?.toString() === yardFilter;

  const matchesTypeFilter = (campaign: Campaign) =>
    filters.type === "all" || campaign.tipo === filters.type;

  const matchesStatusFilter = (campaign: Campaign) =>
    filters.status === "all" ||
    (filters.status === "active" && campaign.isActive) ||
    (filters.status === "inactive" && !campaign.isActive);

  const matchesView = (campaign: Campaign) => {
    switch (activeView) {
      case "active":
        return campaign.isActive;
      case "inactive":
        return !campaign.isActive;
      case "onboarding":
        return campaign.tipo === ManagementType.ONBOARDING;
      case "ar":
        return campaign.tipo === ManagementType.AR;
      default:
        return true;
    }
  };

  const viewCounts = useMemo(() => {
    const base = campaigns.filter((c) => {
      if (campaignIdFilter && c.id !== campaignIdFilter) return false;
      return matchesSearch(c);
    });
    return {
      all: base.length,
      active: base.filter((c) => c.isActive).length,
      inactive: base.filter((c) => !c.isActive).length,
      onboarding: base.filter((c) => c.tipo === ManagementType.ONBOARDING)
        .length,
      ar: base.filter((c) => c.tipo === ManagementType.AR).length,
    };
  }, [campaigns, search, campaignIdFilter, yards]);

  const filteredCampaigns = useMemo(() => {
    return campaigns
      .filter((campaign) => {
        const matchesQuery = campaignIdFilter
          ? campaign.id === campaignIdFilter
          : true;
        return (
          matchesSearch(campaign) &&
          matchesYard(campaign) &&
          matchesTypeFilter(campaign) &&
          matchesStatusFilter(campaign) &&
          matchesView(campaign) &&
          matchesQuery
        );
      })
      .sort((a, b) => b.id - a.id);
  }, [campaigns, search, yardFilter, filters, activeView, campaignIdFilter, yards]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCampaigns.length / itemsPerPage),
  );

  const paginatedCampaigns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCampaigns.slice(start, start + itemsPerPage);
  }, [filteredCampaigns, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, yardFilter, filters, activeView, campaignIdFilter, itemsPerPage]);

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
      await fetchCampaigns();
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
      await fetchCampaigns();
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
        title: "Deleted",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Campaign deleted successfully</span>
          </div>
        ),
      });
      setShowDelete(false);
      setShowCampaignSheet(false);
      setSelectedCampaign(null);
      await fetchCampaigns();
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
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-50">
            Campaigns
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
        <div className="flex min-w-0 flex-1 items-end overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                        ? "border-[#e2fae9] bg-[#e2fae9] font-semibold text-[#008f68]"
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

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <CampaignsGrid
          loading={loading}
          campaigns={paginatedCampaigns}
          yards={yards}
          totalFiltered={filteredCampaigns.length}
          search={search}
          canManage={canManage}
          onCreate={handleCreate}
          onOpen={handleOpen}
          onEdit={canManage ? handleEdit : undefined}
          onDelete={canManage ? handleDelete : undefined}
        />

        <CampaignsPagination
          totalCount={filteredCampaigns.length}
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
            ticketCount={selectedCampaign?.ticketCount}
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
        onEdit={canManage ? handleEdit : undefined}
        onDelete={canManage ? handleDelete : undefined}
      />
    </div>
  );
}
