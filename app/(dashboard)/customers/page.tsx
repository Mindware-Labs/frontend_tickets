"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { CheckCircle2, Plus } from "lucide-react";

import { fetchFromBackend } from "@/lib/api-client";
import { useRole } from "@/components/providers/role-provider";
import { toast } from "@/hooks/use-toast";

import {
  CampaignOption,
  Customer,
  CustomerFormData,
  CustomersListResponse,
  YardOption,
} from "./types";
import {
  CustomersToolbar,
  type CustomersFilterState,
} from "./components/CustomersToolbar";
import { CustomersTable } from "./components/CustomersTable";

const CustomerFormModal = dynamic(
  () => import("./components/CustomerFormModal").then((m) => m.CustomerFormModal),
  { ssr: false },
);
const DeleteCustomerModal = dynamic(
  () =>
    import("./components/DeleteCustomerModal").then((m) => m.DeleteCustomerModal),
  { ssr: false },
);
const CustomerSheet = dynamic(
  () => import("./components/CustomerSheet").then((m) => m.CustomerSheet),
  { ssr: false },
);

const ITEMS_PER_PAGE = 10;

const DEFAULT_FORM: CustomerFormData = {
  name: "",
  phone: "",
  note: "",
  pendingNotes: [],
  campaignIds: [],
};

export default function CustomersPage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useRole();

  const isAgent = role?.toString().toLowerCase() === "agent";
  const canManage = !isAgent;
  const canDelete = role?.toString().toLowerCase() === "admin";
  const customerIdParam = searchParams?.get("customerId");
  const deepLinkedCustomerId = customerIdParam ? Number(customerIdParam) : null;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [yards, setYards] = useState<YardOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<CustomersFilterState>({
    campaign: "all",
    yard: "all",
    hasOpenTickets: "all",
    hasPinnedNote: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(DEFAULT_FORM);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setListError(null);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(ITEMS_PER_PAGE),
      });
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      if (filters.campaign !== "all") {
        params.set("campaignId", filters.campaign);
      }
      if (filters.yard !== "all") {
        params.set("yardId", filters.yard);
      }
      if (filters.hasOpenTickets !== "all") {
        params.set(
          "hasOpenTickets",
          filters.hasOpenTickets === "yes" ? "true" : "false",
        );
      }
      if (filters.hasPinnedNote !== "all") {
        params.set(
          "hasPinnedNote",
          filters.hasPinnedNote === "yes" ? "true" : "false",
        );
      }

      const data = (await fetchFromBackend(
        `/customers?${params.toString()}`,
      )) as CustomersListResponse | Customer[];
      const normalized = Array.isArray(data)
        ? {
            data,
            total: data.length,
            page: currentPage,
            limit: ITEMS_PER_PAGE,
            totalPages: Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE)),
          }
        : data;
      setCustomers(normalized.data ?? []);
      setTotalCustomers(normalized.total ?? 0);
      setTotalPages(Math.max(1, normalized.totalPages ?? 1));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load customers";
      setListError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, filters]);

  const fetchCampaigns = async () => {
    try {
      const data = await fetchFromBackend("/campaign?page=1&limit=200");
      setCampaigns(Array.isArray(data) ? data : (data?.data ?? []));
    } catch {
      console.error("Failed to load campaigns");
    }
  };

  const fetchYards = async () => {
    try {
      const data = await fetchFromBackend("/yards?page=1&limit=200");
      setYards(Array.isArray(data) ? data : (data?.data ?? []));
    } catch {
      console.error("Failed to load yards");
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchCampaigns();
    fetchYards();
  }, []);

  useEffect(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowCustomerSheet(false);
  }, [pathname]);

  useEffect(() => {
    if (!deepLinkedCustomerId || Number.isNaN(deepLinkedCustomerId)) return;
    if (selectedCustomer?.id === deepLinkedCustomerId && showCustomerSheet) return;

    const match = customers.find((customer) => customer.id === deepLinkedCustomerId);
    if (match) {
      setSelectedCustomer(match);
      setShowCustomerSheet(true);
      return;
    }

    let cancelled = false;
    fetchFromBackend(`/customers/${deepLinkedCustomerId}`)
      .then((data: unknown) => {
        if (cancelled) return;
        const customer = (data as { data?: Customer })?.data ?? (data as Customer);
        setSelectedCustomer(customer);
        setShowCustomerSheet(true);
      })
      .catch(() => {
        if (!cancelled) {
          toast({
            title: "Error",
            description: "Failed to load customer details",
            variant: "destructive",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    deepLinkedCustomerId,
    customers,
    selectedCustomer?.id,
    showCustomerSheet,
  ]);

  const handleCustomerSheetOpenChange = (open: boolean) => {
    setShowCustomerSheet(open);
    if (!open) {
      setSelectedCustomer(null);
      if (customerIdParam) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("customerId");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters]);

  const resetForm = () => setFormData(DEFAULT_FORM);
  const clearErrors = () => setValidationErrors({});

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!formData.phone.trim()) errors.phone = "Phone is required";
    return errors;
  };

  const buildPayload = (data: CustomerFormData) => ({
    name: data.name.trim() || undefined,
    phone: data.phone.trim(),
    note: data.note.trim() || undefined,
    campaignIds: data.campaignIds.map(Number),
  });

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSheet(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("customerId", String(customer.id));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCreate = () => {
    resetForm();
    clearErrors();
    setShowCreateModal(true);
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name ?? "",
      phone: customer.phone ?? "",
      note: customer.note ?? "",
      pendingNotes: [],
      campaignIds: customer.campaigns?.map((c) => c.id.toString()) ?? [],
    });
    clearErrors();
    setShowEditModal(true);
  };

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    clearErrors();
    setShowDeleteModal(true);
  };

  const handleSubmitCreate = async () => {
    clearErrors();
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
      const created = await fetchFromBackend("/customers", {
        method: "POST",
        body: JSON.stringify(buildPayload(formData)),
      });

      if (formData.pendingNotes.length > 0 && created?.id) {
        await Promise.all(
          formData.pendingNotes.map((content) =>
            fetchFromBackend(`/customers/${created.id}/notes`, {
              method: "POST",
              body: JSON.stringify({ content }),
            }),
          ),
        );
      }

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
      resetForm();
      await fetchCustomers();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create customer";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedCustomer) return;
    clearErrors();
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
      setSelectedCustomer(null);
      resetForm();
      await fetchCustomers();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update customer";
      toast({ title: "Error", description: message, variant: "destructive" });
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
      setSelectedCustomer(null);
      if (showCustomerSheet) handleCustomerSheetOpenChange(false);
      await fetchCustomers();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete customer";
      toast({ title: "Error", description: message, variant: "destructive" });
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
            Customer Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {today} · Manage contacts, campaigns, and activity
          </p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={handleCreate}
            className="flex h-[30px] shrink-0 items-center gap-1.5 rounded-full px-4 text-[12.5px] font-semibold text-white shadow-sm transition-all active:scale-95"
            style={{ background: "#008f68" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#007a5a";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#008f68";
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Customer
          </button>
        ) : null}
      </div>

      <div className="mt-3 mb-2">
        <CustomersToolbar
          search={search}
          onSearchChange={setSearch}
          filters={filters}
          onFilterChange={(key, value) =>
            setFilters((prev) => ({ ...prev, [key]: value }) as CustomersFilterState)
          }
          onClearFilters={() =>
            setFilters({
              campaign: "all",
              yard: "all",
              hasOpenTickets: "all",
              hasPinnedNote: "all",
            })
          }
          campaigns={campaigns}
          yards={yards}
        />
      </div>

      <div className="flex-1 min-h-0">
        <CustomersTable
          loading={loading}
          customers={customers}
          totalFiltered={totalCustomers}
          error={listError}
          onRetry={fetchCustomers}
          onRowClick={handleRowClick}
          onEdit={canManage ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          canManage={canManage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          totalPages={totalPages}
        />
      </div>

      {canManage ? (
        <>
          <CustomerFormModal
            open={showCreateModal}
            onOpenChange={(open) => {
              setShowCreateModal(open);
              if (!open) clearErrors();
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
              if (!open) clearErrors();
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
            customerId={selectedCustomer?.id}
            existingNotes={selectedCustomer?.notes ?? []}
            onNotesChange={(notes) => {
              if (!selectedCustomer) return;
              const updated = { ...selectedCustomer, notes };
              setSelectedCustomer(updated);
              setCustomers((prev) =>
                prev.map((c) => (c.id === updated.id ? updated : c)),
              );
            }}
          />

          <DeleteCustomerModal
            open={showDeleteModal}
            onOpenChange={(open) => {
              setShowDeleteModal(open);
              if (!open) clearErrors();
            }}
            customerName={selectedCustomer?.name}
            customerPhone={selectedCustomer?.phone}
            ticketCount={selectedCustomer?.ticketCount}
            isSubmitting={isSubmitting}
            onConfirm={handleSubmitDelete}
          />
        </>
      ) : null}

      <CustomerSheet
        open={showCustomerSheet}
        onOpenChange={handleCustomerSheetOpenChange}
        customer={selectedCustomer}
        onEdit={canManage ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
      />
    </div>
  );
}
