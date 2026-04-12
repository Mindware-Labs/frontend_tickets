"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useRole } from "@/components/providers/role-provider";
import { fetchFromBackend } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { ManagementType } from "../tickets/types";
import { Campaign, CampaignFormData, YardSummary } from "./types";
import { CampaignFormModal } from "./components/CampaignFormModal";
import { DeleteCampaignModal } from "./components/DeleteCampaignModal";
import { CampaignsPagination } from "./components/CampaignsPagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CampaignDetailsModal } from "./components/CampaignDetailsModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUpRight,
  CheckCircle2,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Tag,
  Ticket,
  Megaphone,
  XCircle,
  DollarSign,
  Ban,
} from "lucide-react";

type CampaignTicket = {
  id: number;
  status?: string | null;
  createdAt?: string;
  customer?: { name?: string | null };
  customerPhone?: string | null;
  campaignId?: number | null;
  campaign?: { id?: number | null };
};

const DEFAULT_FORM: CampaignFormData = {
  nombre: "",
  yardaId: undefined,
  duracion: "",
  tipo: ManagementType.ONBOARDING,
  isActive: true,
};

const campaignTypeLabels: Record<ManagementType, string> = {
  [ManagementType.ONBOARDING]: "Onboarding",
  [ManagementType.AR]: "AR",
  [ManagementType.OTHER]: "Other",
};

/** Solo dígitos del teléfono para buscar con o sin formato (+1, guiones, espacios). */
function normalizePhone(phone: string): string {
  return (phone || "").replace(/\D/g, "");
}

export default function CampaignsPage() {
  const { role } = useRole();
  const normalizedRole = role?.toString().toLowerCase();
  const isAgent = normalizedRole === "agent";
  const canManage = !isAgent;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [yards, setYards] = useState<YardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<ManagementType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [yardFilter, setYardFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );

  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [campaignTickets, setCampaignTickets] = useState<CampaignTicket[]>([]);
  const [showTicketsPanel, setShowTicketsPanel] = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [formData, setFormData] = useState<CampaignFormData>(DEFAULT_FORM);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await fetchFromBackend("/campaign?page=1&limit=100");
      const items = Array.isArray(data) ? data : data?.data || [];
      setCampaigns(items);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
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
    } catch (error: any) {
      console.error("Error fetching yards:", error);
      // Only show toast if it's not a 401 (unauthorized) - those are handled globally
      if (error?.status !== 401) {
        console.warn(
          "Failed to load yards. This might be expected if the yards feature is not enabled.",
        );
      }
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchYards();
  }, []);

  const pathname = usePathname();
  useEffect(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDetailsModal(false);
  }, [pathname]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const yardName =
        campaign.yarda?.name ||
        yards.find((yard) => yard.id === campaign.yardaId)?.name ||
        "";
      const matchesSearch =
        campaign.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        yardName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "all" || campaign.tipo === typeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && campaign.isActive) ||
        (statusFilter === "inactive" && !campaign.isActive);
      const matchesYard =
        yardFilter === "all" ||
        campaign.yardaId?.toString() === yardFilter ||
        campaign.yarda?.id?.toString() === yardFilter;

      return matchesSearch && matchesType && matchesStatus && matchesYard;
    });
  }, [campaigns, searchTerm, typeFilter, statusFilter, yardFilter, yards]);

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const paginatedCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCampaigns.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCampaigns, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, yardFilter]);

  const getStatusColor = (isActive: boolean) =>
    isActive
      ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
      : "bg-amber-500/10 text-amber-700 border-amber-500/20";

  const getYardLabel = (campaign: Campaign) => {
    return (
      campaign.yarda?.name ||
      yards.find((yard) => yard.id === campaign.yardaId)?.name ||
      "No yard"
    );
  };

  const resetForm = () => setFormData(DEFAULT_FORM);
  const clearValidationErrors = () => setValidationErrors({});

  const handleCreate = () => {
    resetForm();
    clearValidationErrors();
    setShowCreateModal(true);
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
    setShowEditModal(true);
  };

  const handleDelete = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDeleteModal(true);
  };

  const handleDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDetailsModal(true);
    setShowTicketsPanel(false);
    setTicketSearch("");
    setCampaignTickets([]);
  };

  const fetchTicketsForCampaign = async (campaignId: number) => {
    try {
      setTicketsLoading(true);
      const response = await fetchFromBackend("/tickets?page=1&limit=500");
      const items: CampaignTicket[] = response?.data || response || [];
      const filtered = items.filter(
        (ticket) =>
          ticket.campaignId === campaignId ||
          ticket.campaign?.id === campaignId,
      );
      setCampaignTickets(filtered);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setCampaignTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    const term = ticketSearch.toLowerCase();
    const termDigits = normalizePhone(ticketSearch);
    return campaignTickets.filter((ticket) => {
      const name = ticket.customer?.name?.toLowerCase() || "";
      const phone = (ticket.customerPhone || "").toLowerCase();
      const phoneDigits = normalizePhone(ticket.customerPhone || "");
      const id = `#${ticket.id}`;
      const matchesPhoneFormatted = phone.includes(term);
      const matchesPhoneDigits =
        termDigits.length > 0 && phoneDigits.includes(termDigits);
      return (
        name.includes(term) ||
        matchesPhoneFormatted ||
        matchesPhoneDigits ||
        id.toLowerCase().includes(term)
      );
    });
  }, [campaignTickets, ticketSearch]);

  const buildPayload = (data: CampaignFormData) => ({
    ...data,
    yardaId: data.yardaId ?? undefined,
    duracion: data.duracion.trim() ? data.duracion.trim() : undefined,
  });

  const handleSubmitCreate = async () => {
    setValidationErrors({});
    const errors: Record<string, string> = {};
    if (!formData.nombre.trim())
      errors.nombre = "Please enter the campaign name.";
    if (!formData.tipo) errors.tipo = "Please select a campaign type.";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Missing fields",
        description: "Please review fields.",
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
      setShowCreateModal(false);
      fetchCampaigns();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedCampaign) return;
    setValidationErrors({});
    const errors: Record<string, string> = {};
    if (!formData.nombre.trim())
      errors.nombre = "Please enter the campaign name.";
    if (!formData.tipo) errors.tipo = "Please select a campaign type.";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Missing fields",
        description: "Please review fields.",
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
      setShowEditModal(false);
      fetchCampaigns();
      resetForm();
      setSelectedCampaign(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update.",
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
      setShowDeleteModal(false);
      fetchCampaigns();
      setSelectedCampaign(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-primary" /> Campaigns
          </h1>
          <p className="text-muted-foreground">Manage initiatives.</p>
        </div>
        {canManage && (
          <Button
            className="bg-primary hover:bg-primary/90 gap-2"
            onClick={handleCreate}
          >
            <Plus className="h-4 w-4" /> New Campaign
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={typeFilter} onValueChange={(v: any) => setTypeFilter(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(campaignTypeLabels).map(([v, l]) => (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v: any) => setStatusFilter(v)}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={yardFilter} onValueChange={(v) => setYardFilter(v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Yard" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Yards</SelectItem>
            {yards.map((y) => (
              <SelectItem key={y.id} value={y.id.toString()} title={y.name}>
                <span className="truncate block max-w-[180px]">{y.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => {
            setTypeFilter("all");
            setStatusFilter("all");
            setYardFilter("all");
            setSearchTerm("");
          }}
        >
          Clear
        </Button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {paginatedCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="group relative flex flex-col justify-between overflow-hidden border border-border/60 bg-gradient-to-b from-card to-card/50 text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20"
              >
                {campaign.isActive && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-emerald-500 to-emerald-600 opacity-80" />
                )}

                <CardHeader className="pb-4 pt-5 pl-7">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1 min-w-0">
                      {/* TÍTULO CON TRUNCAMIENTO */}
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <span
                          className="truncate block max-w-[200px]"
                          title={campaign.nombre}
                        >
                          {campaign.nombre}
                        </span>
                        {campaign.isActive && (
                          <span className="relative flex h-2.5 w-2.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                        )}
                      </CardTitle>

                      <CardDescription className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-primary/70">
                          #{campaign.id}
                        </span>
                        <span>
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDetails(campaign)}
                        >
                          View Details
                        </DropdownMenuItem>
                        {canManage && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleEdit(campaign)}
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(campaign)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 pb-6 pl-7 pr-6">
                  <div className="grid grid-cols-2 gap-4 rounded-xl bg-muted/40 p-3 border border-border/30">
                    <div className="space-y-0.5">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <Ticket className="h-3 w-3" />
                        Tickets
                      </span>
                      <p className="text-2xl font-bold">
                        {campaign.ticketCount ?? 0}
                      </p>
                    </div>

                    <div className="space-y-1 border-l border-border/40 pl-4 flex flex-col justify-center">
                      {/* CONTADORES CON ESTILO DE CHIPS/BADGES */}
                      {campaign.tipo === ManagementType.ONBOARDING ? (
                        <>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <Badge
                              variant="outline"
                              className="h-5 px-1.5 bg-emerald-500/10 text-emerald-700 border-emerald-500/20 rounded-md font-medium shadow-sm"
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />{" "}
                              Registered
                            </Badge>
                            <span className="font-bold text-foreground text-sm">
                              {campaign.registeredCount ?? 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <Badge
                              variant="outline"
                              className="h-5 px-1.5 bg-red-500/10 text-red-700 border-red-500/20 rounded-md font-medium shadow-sm"
                            >
                              <XCircle className="h-3 w-3 mr-1" /> Not
                              Registered
                            </Badge>
                            <span className="font-bold text-foreground text-sm">
                              {campaign.notRegisteredCount ?? 0}
                            </span>
                          </div>
                        </>
                      ) : campaign.tipo === ManagementType.AR ? (
                        <>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <Badge
                              variant="outline"
                              className="h-5 px-1.5 bg-emerald-500/10 text-emerald-700 border-emerald-500/20 rounded-md font-medium shadow-sm"
                            >
                              <DollarSign className="h-3 w-3 mr-1" /> Paid
                            </Badge>
                            <span className="font-bold text-foreground text-sm">
                              {campaign.paidCount ?? 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <Badge
                              variant="outline"
                              className="h-5 px-1.5 bg-red-500/10 text-red-700 border-red-500/20 rounded-md font-medium shadow-sm"
                            >
                              <Ban className="h-3 w-3 mr-1" /> Not Paid
                            </Badge>
                            <span className="font-bold text-foreground text-sm">
                              {campaign.notPaidCount ?? 0}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">
                            Duration
                          </span>
                          <p className="text-lg font-semibold truncate">
                            {campaign.duracion || "—"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/5 text-blue-700 border-blue-200/40 hover:bg-blue-500/10 dark:text-blue-400 dark:border-blue-900/40 transition-colors"
                    >
                      <Tag className="h-3 w-3" />
                      <span
                        className="truncate block max-w-[100px]"
                        title={campaignTypeLabels[campaign.tipo]}
                      >
                        {campaignTypeLabels[campaign.tipo]}
                      </span>
                    </Badge>

                    {/* BADGE DEL YARD CON TRUNCAMIENTO */}
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/5 text-orange-700 border-orange-200/40 hover:bg-orange-500/10 dark:text-orange-400 dark:border-orange-900/40 transition-colors"
                    >
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span
                        className="truncate block max-w-[100px]"
                        title={getYardLabel(campaign)}
                      >
                        {getYardLabel(campaign)}
                      </span>
                    </Badge>
                  </div>
                </CardContent>

                <CardFooter className="border-t bg-muted/30 px-6 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-xs"
                    onClick={() => handleDetails(campaign)}
                  >
                    View Full Report <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <CampaignsPagination
            totalCount={filteredCampaigns.length}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {canManage && (
        <>
          <CampaignFormModal
            open={showCreateModal}
            onOpenChange={setShowCreateModal}
            title="Create"
            description=""
            submitLabel="Create"
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
            open={showEditModal}
            onOpenChange={setShowEditModal}
            title="Edit"
            description=""
            submitLabel="Save"
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
            open={showDeleteModal}
            onOpenChange={setShowDeleteModal}
            campaignName={selectedCampaign?.nombre}
            ticketCount={selectedCampaign?.ticketCount}
            isSubmitting={isSubmitting}
            onConfirm={handleSubmitDelete}
          />
        </>
      )}

      <CampaignDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        campaign={selectedCampaign}
        campaignTypeLabels={campaignTypeLabels}
        getStatusColor={getStatusColor}
        getYardLabel={getYardLabel}
        showTicketsPanel={showTicketsPanel}
        ticketsLoading={ticketsLoading}
        tickets={filteredTickets}
        ticketSearch={ticketSearch}
        setTicketSearch={setTicketSearch}
        onViewTickets={async () => {
          if (selectedCampaign) {
            if (!showTicketsPanel)
              await fetchTicketsForCampaign(selectedCampaign.id);
            setShowTicketsPanel(true);
          }
        }}
      />
    </div>
  );
}
