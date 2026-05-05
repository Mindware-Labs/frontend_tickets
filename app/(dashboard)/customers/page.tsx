// app/customers/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { CheckCircle2, Plus } from "lucide-react";

import { fetchFromBackend } from "@/lib/api-client";
import { useRole } from "@/components/providers/role-provider";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

import { CampaignOption, Customer, CustomerFormData } from "./types";
import { CustomersToolbar } from "./components/CustomersToolbar";
import { CustomersTable } from "./components/CustomersTable";
import { Customer360Drawer } from "./components/CustomerDrawer";

// Heavy modals loaded only when needed
const CustomerFormModal = dynamic(
  () => import("./components/CustomerFormModal").then((m) => m.CustomerFormModal),
  { ssr: false },
);
const DeleteCustomerModal = dynamic(
  () => import("./components/DeleteCustomerModal").then((m) => m.DeleteCustomerModal),
  { ssr: false },
);

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

const DEFAULT_FORM: CustomerFormData = {
  name: "",
  phone: "",
  note: "",
  pendingNotes: [],
  campaignIds: [],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const { role } = useRole();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isAgent = role?.toString().toLowerCase() === "agent";
  const canManage = !isAgent;

  // ── Data state ──
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [loading, setLoading] = useState(true);

  // ── UI state ──
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomers, setSelectedCustomers] = useState<number[]>([]);

  // ── Modal / drawer state ──
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // ── Form state ──
  const [formData, setFormData] = useState<CustomerFormData>(DEFAULT_FORM);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Misc refs ──
  const prevCountRef = useRef(0);

  // ─── Data fetching ───────────────────────────────────────────────────────────

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await fetchFromBackend("/customers?page=1&limit=5000");
      setCustomers(Array.isArray(data) ? data : (data?.data ?? []));
    } catch {
      toast({ title: "Error", description: "Failed to load customers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const data = await fetchFromBackend("/campaign?page=1&limit=200");
      setCampaigns(Array.isArray(data) ? data : (data?.data ?? []));
    } catch {
      console.error("Failed to load campaigns");
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchCampaigns();
  }, []);

  // ─── Toast when new customers appear ─────────────────────────────────────────

  useEffect(() => {
    if (customers.length > 0 && prevCountRef.current > 0) {
      const diff = customers.length - prevCountRef.current;
      if (diff > 0) {
        toast({
          title: `New Customer${diff > 1 ? "s" : ""}`,
          description: `${diff} new customer${diff > 1 ? "s" : ""} added`,
          duration: 3000,
        });
      }
    }
    prevCountRef.current = customers.length;
  }, [customers.length]);

  // ─── Close everything on route change ────────────────────────────────────────

  useEffect(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowDrawer(false);
  }, [pathname]);

  // ─── Open drawer from URL param (?customerId=X) ───────────────────────────────

  useEffect(() => {
    const id = searchParams.get("customerId");
    if (!id || customers.length === 0 || showDrawer) return;

    const customer = customers.find((c) => c.id.toString() === id);
    if (!customer) return;

    openDrawer(customer);

    // Clean the URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.delete("customerId");
    window.history.replaceState({}, "", url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, customers]);

  // ─── Derived data ─────────────────────────────────────────────────────────────

  const filteredCustomers = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return customers;
    return customers.filter((c) => {
      const name = c.name?.toLowerCase() ?? "";
      const phone = c.phone?.toLowerCase() ?? "";
      const id = c.id?.toString() ?? "";
      const campaigns = c.campaigns?.map((x) => x.nombre).join(" ").toLowerCase() ?? "";
      return name.includes(term) || phone.includes(term) || id.includes(term) || campaigns.includes(term);
    });
  }, [customers, search]);

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);

  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  // Reset page + selection when search changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCustomers([]);
  }, [search]);

  // ─── Form helpers ─────────────────────────────────────────────────────────────

  const resetForm = () => setFormData(DEFAULT_FORM);
  const clearErrors = () => setValidationErrors({});

  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.phone.trim()) errors.phone = "Phone is required";
    return errors;
  };

  const buildPayload = (data: CustomerFormData) => ({
    name: data.name.trim(),
    phone: data.phone.trim(),
    note: data.note.trim() || undefined,
    campaignIds: data.campaignIds.map(Number),
  });

  // ─── Action handlers ──────────────────────────────────────────────────────────

  const openDrawer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDrawer(true);
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

  // ─── Bulk actions ─────────────────────────────────────────────────────────────

  const handleClearSelection = () => setSelectedCustomers([]);

  const handleAssignCampaign = () => {
    toast({
      title: "Bulk Action",
      description: `Assign ${selectedCustomers.length} customer${selectedCustomers.length !== 1 ? "s" : ""} to campaign`,
    });
  };

  const handleMergeContacts = () => {
    if (selectedCustomers.length < 2) {
      toast({ title: "Cannot Merge", description: "Select at least 2 customers to merge", variant: "destructive" });
      return;
    }
    toast({
      title: "Bulk Action",
      description: `Merge ${selectedCustomers.length} contacts`,
    });
  };

  // ─── Submit handlers ──────────────────────────────────────────────────────────

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
      const created = await fetchFromBackend("/customers", {
        method: "POST",
        body: JSON.stringify(buildPayload(formData)),
      });

      // Save any pending notes for the new customer
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
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Failed to create customer", variant: "destructive" });
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
      toast({ title: "Validation Error", description: "Please fill in all required fields", variant: "destructive" });
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
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Failed to update customer", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedCustomer) return;

    try {
      setIsSubmitting(true);
      await fetchFromBackend(`/customers/${selectedCustomer.id}`, { method: "DELETE" });

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
      setSelectedCustomers((prev) => prev.filter((id) => id !== selectedCustomer.id));
      setSelectedCustomer(null);
      await fetchCustomers();
    } catch (err: any) {
      toast({ title: "Error", description: err.message ?? "Failed to delete customer", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="h-screen flex flex-col px-4 pt-4 pb-4 gap-0">

      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between w-full py-5 px-0.5 gap-3 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50 leading-tight">
            Customer Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {today} 
          </p>
        </div>

        {canManage && (
          <Button
            onClick={handleCreate}
            className="h-9 px-4 rounded-xl bg-[#008f68] hover:bg-[#007a5a] text-white text-[13px] font-medium shadow-sm"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Customer
          </Button>
        )}
      </div>

      {/* ── Search / filter toolbar ── */}
      <div className="mt-3 mb-2">
        <CustomersToolbar
          search={search}
          onSearchChange={setSearch}
          onRefresh={fetchCustomers}
          onCreate={canManage ? handleCreate : undefined}
          canCreate={false}
          totalCount={filteredCustomers.length}
          selectedCount={selectedCustomers.length}
          onClearSelection={handleClearSelection}
          onAssignCampaign={handleAssignCampaign}
        />
      </div>

      {/* ── Table ── */}
      <div className="flex-1 min-h-0">
        <CustomersTable
          loading={loading}
          customers={paginatedCustomers}
          totalFiltered={filteredCustomers.length}
          selectedCustomers={selectedCustomers}
          onSelectionChange={setSelectedCustomers}
          onDetails={openDrawer}
          onEdit={canManage ? handleEdit : undefined}
          onDelete={canManage ? handleDelete : undefined}
          canManage={canManage}
          search={search}
          onSearchChange={setSearch}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsPerPage={ITEMS_PER_PAGE}
          totalPages={totalPages}
        />
      </div>

      {/* ── Customer 360 drawer ── */}
      <Customer360Drawer
        open={showDrawer}
        onOpenChange={setShowDrawer}
        customer={selectedCustomer}
      />

      {/* ── Modals (manager-only) ── */}
      {canManage && (
        <>
          <CustomerFormModal
            open={showCreateModal}
            onOpenChange={(open) => { setShowCreateModal(open); if (!open) clearErrors(); }}
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
            onOpenChange={(open) => { setShowEditModal(open); if (!open) clearErrors(); }}
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
              setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            }}
          />

          <DeleteCustomerModal
            open={showDeleteModal}
            onOpenChange={(open) => { setShowDeleteModal(open); if (!open) clearErrors(); }}
            customerName={selectedCustomer?.name}
            ticketCount={selectedCustomer?.ticketCount}
            isSubmitting={isSubmitting}
            onConfirm={handleSubmitDelete}
          />
        </>
      )}
    </div>
  );
}