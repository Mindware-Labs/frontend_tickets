"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { useRole } from "@/components/providers/role-provider";
import { fetchFromBackend } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";
import { YardsFilters } from "./components/YardsFilters";
import { YardsToolbar } from "./components/YardsToolbar";
import { YardsTable } from "./components/YardsTable";
import { YardsPagination } from "./components/YardsPagination";
import { YardFormModal } from "./components/YardFormModal";
import { DeleteYardModal } from "./components/DeleteYardModal";
import { YardDetailsModal } from "./components/YardDetailsModal";
import { Yard, YardFormData } from "./types";
import { CheckCircle2 } from "lucide-react";

type YardTicket = {
  id: number;
  status?: string | null;
  createdAt?: string;
  customer?: { name?: string | null };
  customerPhone?: string | null;
  yardId?: number | null;
};

export default function YardsPage() {
  const searchParams = useSearchParams();
  const { role } = useRole();
  const normalizedRole = role?.toString().toLowerCase();
  const isAgent = normalizedRole === "agent";
  const canManage = !isAgent;
  const yardIdParam = searchParams?.get("yardId");
  const yardIdFilter = yardIdParam ? Number(yardIdParam) : null;

  const [yards, setYards] = useState<Yard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedYard, setSelectedYard] = useState<Yard | null>(null);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [yardTickets, setYardTickets] = useState<YardTicket[]>([]);
  const [showTicketsPanel, setShowTicketsPanel] = useState(false);
  const [showLandlordPanel, setShowLandlordPanel] = useState(false);
  const [ticketSearch, setTicketSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const [formData, setFormData] = useState<YardFormData>({
    name: "",
    commonName: "",
    propertyAddress: "",
    contactInfo: "",
    yardLink: "",
    notes: "",
    yardType: "SAAS" as "SAAS" | "FULL_SERVICE",
    isActive: true,
  });

  // Fetch yards from backend
  const fetchYards = async () => {
    try {
      setLoading(true);
      const data = await fetchFromBackend("/yards");
      setYards(data);
    } catch (error) {
      console.error("Error fetching yards:", error);
      toast({
        title: "Error",
        description: "Failed to load yards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  // Filter yards
  const filteredYards = useMemo(() => {
    return yards
      .filter((yard) => {
        const matchesSearch =
          yard.name.toLowerCase().includes(search.toLowerCase()) ||
          yard.commonName.toLowerCase().includes(search.toLowerCase()) ||
          yard.propertyAddress.toLowerCase().includes(search.toLowerCase()) ||
          yard.contactInfo.toLowerCase().includes(search.toLowerCase()) ||
          (yard.landlord?.name || "")
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesType =
          typeFilter === "all" || yard.yardType === typeFilter;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && yard.isActive) ||
          (statusFilter === "inactive" && !yard.isActive);

        const matchesQuery = yardIdFilter ? yard.id === yardIdFilter : true;

        return matchesSearch && matchesType && matchesStatus && matchesQuery;
      })
      .sort((a, b) => a.id - b.id); // Ordenar por ID de menor a mayor (1 a x)
  }, [yards, search, typeFilter, statusFilter, yardIdFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredYards.length / itemsPerPage);
  const paginatedYards = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredYards.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredYards, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, statusFilter, yardIdFilter]);

  useEffect(() => {
    if (!yardIdFilter || yards.length === 0) return;
    const match = yards.find((y) => y.id === yardIdFilter);
    if (match) {
      handleDetails(match);
    }
  }, [yardIdFilter, yards]);

  const resetForm = () => {
    setFormData({
      name: "",
      commonName: "",
      propertyAddress: "",
      contactInfo: "",
      yardLink: "",
      notes: "",
      yardType: "SAAS",
      isActive: true,
    });
  };

  const clearValidationErrors = () => setValidationErrors({});

  const handleCreate = () => {
    resetForm();
    clearValidationErrors();
    setShowCreateModal(true);
  };

  const handleEdit = (yard: Yard) => {
    setSelectedYard(yard);
    setFormData({
      name: yard.name,
      commonName: yard.commonName,
      propertyAddress: yard.propertyAddress,
      contactInfo: yard.contactInfo,
      yardLink: yard.yardLink || "",
      notes: yard.notes || "",
      yardType: yard.yardType,
      isActive: yard.isActive,
    });
    clearValidationErrors();
    setShowEditModal(true);
  };

  const handleDelete = (yard: Yard) => {
    setSelectedYard(yard);
    clearValidationErrors();
    setShowDeleteModal(true);
  };

  const handleDetails = (yard: Yard) => {
    setSelectedYard(yard);
    setShowDetailsModal(true);
    setShowTicketsPanel(false);
    setShowLandlordPanel(false);
    setTicketSearch("");
    setYardTickets([]);
  };

  const fetchTicketsForYard = async (yardId: number) => {
    try {
      setTicketsLoading(true);
      const response = await fetchFromBackend("/tickets?page=1&limit=500");
      const items: YardTicket[] = response?.data || response || [];
      const filtered = items.filter((ticket) => ticket.yardId === yardId);
      setYardTickets(filtered);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      setYardTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    const term = ticketSearch.toLowerCase();
    return yardTickets.filter((ticket) => {
      const name = ticket.customer?.name?.toLowerCase() || "";
      const phone = (ticket.customerPhone || "").toLowerCase();
      const id = `#${ticket.id}`;
      return (
        name.includes(term) ||
        phone.includes(term) ||
        id.toLowerCase().includes(term)
      );
    });
  }, [yardTickets, ticketSearch]);

  const handleSubmitCreate = async () => {
    setValidationErrors({});

    // Frontend validation
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.commonName.trim())
      errors.commonName = "Common name is required";
    if (!formData.propertyAddress.trim())
      errors.propertyAddress = "Address is required";
    if (!formData.contactInfo.trim())
      errors.contactInfo = "Contact info is required";

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
      fetchYards();
      resetForm();
    } catch (error: any) {
      console.error("Error creating yard:", error);

      // Handle validation errors from backend
      if (error.message && typeof error.message === "object") {
        setValidationErrors(error.message);
        toast({
          title: "Validation Error",
          description: "Please check the form for errors",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to create yard",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedYard) return;

    // Reset validation errors
    setValidationErrors({});

    // Frontend validation
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.commonName.trim())
      errors.commonName = "Common name is required";
    if (!formData.propertyAddress.trim())
      errors.propertyAddress = "Address is required";
    if (!formData.contactInfo.trim())
      errors.contactInfo = "Contact info is required";

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
      fetchYards();
      resetForm();
      setSelectedYard(null);
    } catch (error: any) {
      console.error("Error updating yard:", error);

      // Handle validation errors from backend
      if (error.message && typeof error.message === "object") {
        setValidationErrors(error.message);
        toast({
          title: "Validation Error",
          description: "Please check the form for errors",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to update yard",
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
      await fetchFromBackend(`/yards/${selectedYard.id}`, {
        method: "DELETE",
      });

      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Yard deleted successfully</span>
          </div>
        ),
      });

      setShowDeleteModal(false);
      fetchYards();
      setSelectedYard(null);
    } catch (error: any) {
      console.error("Error deleting yard:", error);
      let errorMsg = error.message || "Failed to delete yard.";
      if (
        errorMsg.includes(
          "No se puede eliminar la yard porque tiene tickets asociados"
        )
      ) {
        errorMsg = "Cannot delete yard because it has associated tickets.";
      }
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* CAMBIO IMPORTANTE: Cambiar h-[calc(100vh-4rem)] por min-h-[calc(100vh-4rem)] */}
      <div className="flex min-h-[calc(100vh-4rem)] gap-4">
        <YardsFilters
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          onTypeChange={setTypeFilter}
          onStatusChange={setStatusFilter}
          onCreate={canManage ? handleCreate : undefined}
          canCreate={canManage}
        />

        {/* Main area */}
        <div className="flex-1 flex flex-col gap-4">
          <YardsToolbar
            search={search}
            onSearchChange={setSearch}
            onRefresh={fetchYards}
            totalCount={filteredYards.length}
          />

          <YardsTable
            loading={loading}
            yards={paginatedYards}
            totalFiltered={filteredYards.length}
            onDetails={handleDetails}
            onEdit={canManage ? handleEdit : undefined}
            onDelete={canManage ? handleDelete : undefined}
            canManage={canManage}
          />

          <YardsPagination
            totalCount={filteredYards.length}
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
      </div>

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
        idPrefix="edit"
      />

      <DeleteYardModal
        open={showDeleteModal}
        onOpenChange={(open) => {
          setShowDeleteModal(open);
          if (!open) clearValidationErrors();
        }}
        yardName={selectedYard?.name}
        ticketCount={selectedYard?.ticketCount}
        isSubmitting={isSubmitting}
        onConfirm={handleSubmitDelete}
      />

      <YardDetailsModal
        open={showDetailsModal}
        onOpenChange={(open) => {
          setShowDetailsModal(open);
          if (!open) {
            setShowTicketsPanel(false);
            setShowLandlordPanel(false);
            setTicketSearch("");
            setYardTickets([]);
          }
        }}
        yard={selectedYard}
        showTicketsPanel={showTicketsPanel}
        showLandlordPanel={showLandlordPanel}
        ticketsLoading={ticketsLoading}
        tickets={filteredTickets}
        ticketSearch={ticketSearch}
        setTicketSearch={setTicketSearch}
        onViewTickets={async () => {
          if (!selectedYard) return;
          if (!showTicketsPanel) {
            await fetchTicketsForYard(selectedYard.id);
          }
          setShowLandlordPanel(false);
          setShowTicketsPanel(true);
        }}
        onViewLandlord={() => {
          if (!selectedYard) return;
          setShowTicketsPanel(false);
          setShowLandlordPanel(true);
        }}
      />
    </>
  );
}
