"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { fetchFromBackend } from "@/lib/api-client";
import { useRole } from "@/components/providers/role-provider";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { CampaignOption, Customer, CustomerFormData } from "./types";
import { CustomersToolbar } from "./components/CustomersToolbar";
import { CustomersTable } from "./components/CustomersTable";
import { CustomersPagination } from "./components/CustomersPagination";
import { CustomerFormModal } from "./components/CustomerFormModal";
import { DeleteCustomerModal } from "./components/DeleteCustomerModal";
import { CustomerDetailsModal } from "./components/CustomerDetailsModal";

const DEFAULT_FORM: CustomerFormData = {
  name: "",
  phone: "",
  note: "",
  campaignIds: [],
};

export default function CustomersPage() {
  const { role } = useRole();
  const normalizedRole = role?.toString().toLowerCase();
  const isAgent = normalizedRole === "agent";
  const canManage = !isAgent;
  const searchParams = useSearchParams();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [formData, setFormData] = useState<CustomerFormData>(DEFAULT_FORM);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [customerTickets, setCustomerTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await fetchFromBackend("/customers?page=1&limit=5000");
      const items = Array.isArray(data) ? data : data?.data || [];
      setCustomers(items);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const data = await fetchFromBackend("/campaign?page=1&limit=200");
      const items = Array.isArray(data) ? data : data?.data || [];
      setCampaigns(items);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchCampaigns();
  }, []);

  // Close all modals when route changes
  const pathname = usePathname();
  useEffect(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDetailsModal(false);
  }, [pathname]);

  // Abrir modal automáticamente si hay customerId en la URL
  useEffect(() => {
    const customerIdParam = searchParams.get("customerId");
    if (customerIdParam && customers.length > 0 && !showDetailsModal) {
      const customer = customers.find(
        (c) => c.id.toString() === customerIdParam
      );
      if (customer) {
        console.log('🔍 [Customers Page] Opening modal automatically for customer:', customerIdParam);
        handleDetails(customer);
        // Limpiar el parámetro de la URL después de abrir el modal
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            url.searchParams.delete("customerId");
            window.history.replaceState({}, "", url.toString());
          }
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, customers]);

  // Abrir modal automáticamente si hay customerId en la URL
  useEffect(() => {
    const customerIdParam = searchParams.get("customerId");
    if (customerIdParam && customers.length > 0) {
      const customer = customers.find(
        (c) => c.id.toString() === customerIdParam
      );
      if (customer) {
        handleDetails(customer);
        // Limpiar el parámetro de la URL después de abrir el modal
        const url = new URL(window.location.href);
        url.searchParams.delete("customerId");
        window.history.replaceState({}, "", url.toString());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, customers]);

  const filteredCustomers = useMemo(() => {
    const term = search.toLowerCase();
    return customers.filter((customer) => {
      const name = customer.name?.toLowerCase() || "";
      const phone = customer.phone?.toLowerCase() || "";
      const campaignNames =
        customer.campaigns?.map((campaign) => campaign.nombre).join(" ") || "";
      return (
        name.includes(term) ||
        phone.includes(term) ||
        campaignNames.toLowerCase().includes(term)
      );
    });
  }, [customers, search]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

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

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || "",
      phone: customer.phone || "",
      note: customer.note || "",
      campaignIds:
        customer.campaigns?.map((campaign) => campaign.id.toString()) || [],
    });
    clearValidationErrors();
    setShowEditModal(true);
  };

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    clearValidationErrors();
    setShowDeleteModal(true);
  };

  const handleDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
    setTicketsLoading(true);
    setCustomerTickets([]);
    try {
      const response = await fetchFromBackend("/tickets?page=1&limit=500");
      const tickets = Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];
      const filtered = tickets.filter(
        (ticket: any) =>
          ticket.customerId === customer.id ||
          ticket.customer?.id === customer.id
      );
      setCustomerTickets(filtered);
    } catch (error) {
      console.error("Error fetching tickets for customer", error);
      setCustomerTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  const buildPayload = (data: CustomerFormData) => ({
    name: data.name.trim(),
    phone: data.phone.trim(),
    note: data.note.trim() || undefined,
    campaignIds: data.campaignIds.map((id) => Number(id)),
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.phone.trim()) errors.phone = "Phone is required";
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
      await fetchFromBackend("/customers", {
        method: "POST",
        body: JSON.stringify(buildPayload(formData)),
      });

      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Customer created successfully</span>
          </div>
        ),
      });

      setShowCreateModal(false);
      fetchCustomers();
      resetForm();
    } catch (error: any) {
      console.error("Error creating customer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create customer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedCustomer) return;
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
      await fetchFromBackend(`/customers/${selectedCustomer.id}`, {
        method: "PATCH",
        body: JSON.stringify(buildPayload(formData)),
      });

      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Customer updated successfully</span>
          </div>
        ),
      });

      setShowEditModal(false);
      fetchCustomers();
      resetForm();
      setSelectedCustomer(null);
    } catch (error: any) {
      console.error("Error updating customer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update customer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedCustomer) return;

    try {
      setIsSubmitting(true);
      await fetchFromBackend(`/customers/${selectedCustomer.id}`, {
        method: "DELETE",
      });

      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Customer deleted successfully</span>
          </div>
        ),
      });

      setShowDeleteModal(false);
      fetchCustomers();
      setSelectedCustomer(null);
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete customer",
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
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage customers and their campaign assignments
          </p>
        </div>

        <CustomersToolbar
          search={search}
          onSearchChange={setSearch}
          onRefresh={fetchCustomers}
          onCreate={canManage ? handleCreate : undefined}
          totalCount={filteredCustomers.length}
        />

        <CustomersTable
          loading={loading}
          customers={paginatedCustomers}
          totalFiltered={filteredCustomers.length}
          onDetails={handleDetails}
          onEdit={canManage ? handleEdit : undefined}
          onDelete={canManage ? handleDelete : undefined}
          canManage={canManage}
        />

        <CustomersPagination
          totalCount={filteredCustomers.length}
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

      <CustomerDetailsModal
        open={showDetailsModal}
        onOpenChange={(open) => setShowDetailsModal(open)}
        customer={selectedCustomer}
        tickets={customerTickets}
        ticketsLoading={ticketsLoading}
      />

      {canManage && (
        <>
          <CustomerFormModal
            open={showCreateModal}
            onOpenChange={(open) => {
              setShowCreateModal(open);
              if (!open) clearValidationErrors();
            }}
            title="Create New Customer"
            description="Fill in the details to create a customer"
            submitLabel="Create Customer"
            isSubmitting={isSubmitting}
            formData={formData}
            onFormChange={setFormData}
            validationErrors={validationErrors}
            onValidationErrorChange={setValidationErrors}
            onSubmit={handleSubmitCreate}
            campaigns={campaigns}
            idPrefix="create"
          />

          <CustomerFormModal
            open={showEditModal}
            onOpenChange={(open) => {
              setShowEditModal(open);
              if (!open) clearValidationErrors();
            }}
            title="Edit Customer"
            description="Update customer details"
            submitLabel="Save Changes"
            isSubmitting={isSubmitting}
            formData={formData}
            onFormChange={setFormData}
            validationErrors={validationErrors}
            onValidationErrorChange={setValidationErrors}
            onSubmit={handleSubmitEdit}
            campaigns={campaigns}
            idPrefix="edit"
          />

          <DeleteCustomerModal
            open={showDeleteModal}
            onOpenChange={(open) => {
              setShowDeleteModal(open);
              if (!open) clearValidationErrors();
            }}
            customerName={selectedCustomer?.name}
            ticketCount={selectedCustomer?.ticketCount}
            isSubmitting={isSubmitting}
            onConfirm={handleSubmitDelete}
          />
        </>
      )}
    </>
  );
}
