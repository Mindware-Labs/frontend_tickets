"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { CheckCircle2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchFromBackend } from "@/lib/api-client";
import {
  buildListQueryString,
  usePaginatedList,
} from "@/hooks/use-paginated-list";
import { cn } from "@/lib/utils";
import type { User, UserFormData } from "./types";
import { UsersToolbar } from "./components/UsersToolbar";
import { UsersGrid } from "./components/UsersGrid";
import { UsersPagination } from "./components/UsersPagination";

const UserFormModal = dynamic(
  () => import("./components/UserFormModal").then((m) => m.UserFormModal),
  { ssr: false },
);
const DeleteUserModal = dynamic(
  () => import("./components/DeleteUserModal").then((m) => m.DeleteUserModal),
  { ssr: false },
);
const UserStatusConfirmModal = dynamic(
  () =>
    import("./components/UserStatusConfirmModal").then(
      (m) => m.UserStatusConfirmModal,
    ),
  { ssr: false },
);

const DEFAULT_FORM: UserFormData = {
  name: "",
  lastName: "",
  email: "",
  role: "agent",
  isActive: true,
};

const VIEW_TABS = [
  { key: "all", label: "All Members" },
  { key: "active", label: "Active" },
  { key: "blocked", label: "Blocked" },
  { key: "admin", label: "Admins" },
  { key: "agent", label: "Agents" },
] as const;

type UserView = (typeof VIEW_TABS)[number]["key"];

export default function UsersPage() {
  const pathname = usePathname();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeView, setActiveView] = useState<UserView>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(DEFAULT_FORM);
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
      includeViewCounts: true,
    });
    return `/users?${qs}`;
  }, [currentPage, itemsPerPage, debouncedSearch, activeView]);

  const {
    items: users,
    total: totalFiltered,
    totalPages,
    viewCounts: serverViewCounts,
    isLoading: loading,
    error: listError,
    mutate: refreshUsers,
  } = usePaginatedList<User>(listQuery);

  useEffect(() => {
    if (listError) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  }, [listError]);

  useEffect(() => {
    setShowCreate(false);
    setShowEdit(false);
    setShowDelete(false);
    setShowStatusConfirm(false);
  }, [pathname]);

  const viewCounts = useMemo(
    () =>
      serverViewCounts ?? {
        all: 0,
        active: 0,
        blocked: 0,
        admin: 0,
        agent: 0,
      },
    [serverViewCounts],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, activeView, itemsPerPage]);

  const resetForm = () => setFormData(DEFAULT_FORM);
  const clearValidationErrors = () => setValidationErrors({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    return errors;
  };

  const handleCreate = () => {
    resetForm();
    clearValidationErrors();
    setShowCreate(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    clearValidationErrors();
    setShowEdit(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setShowDelete(true);
  };

  const handleSubmitCreate = async () => {
    clearValidationErrors();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetchFromBackend("/users", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          role: formData.role,
        }),
      });

      const resetCode = response?.reset?.resetCode;
      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>
              {resetCode
                ? `User created. Reset code (dev): ${resetCode}`
                : "User created. A reset code was sent by email."}
            </span>
          </div>
        ),
      });

      setShowCreate(false);
      resetForm();
      await refreshUsers();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedUser) return;
    clearValidationErrors();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      await fetchFromBackend(`/users/${selectedUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: formData.name.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          role: formData.role,
          isActive: formData.isActive,
        }),
      });

      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>User updated successfully</span>
          </div>
        ),
      });
      setShowEdit(false);
      setSelectedUser(null);
      await refreshUsers();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDelete = async () => {
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      await fetchFromBackend(`/users/${selectedUser.id}`, { method: "DELETE" });
      toast({
        title: "Success",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>User deleted successfully</span>
          </div>
        ),
      });
      setShowDelete(false);
      setSelectedUser(null);
      await refreshUsers();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to delete user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = (user: User) => {
    setSelectedUser(user);
    setShowStatusConfirm(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!selectedUser) return;
    try {
      setIsSubmitting(true);
      await fetchFromBackend(`/users/${selectedUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !selectedUser.isActive }),
      });
      toast({
        title: "Success",
        description: `${selectedUser.email} is now ${
          selectedUser.isActive ? "blocked" : "active"
        }.`,
      });
      setShowStatusConfirm(false);
      setSelectedUser(null);
      await refreshUsers();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to update user status",
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
            Team Members
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {today} · Manage access, roles, and account status
          </p>
        </div>
      </div>

      <div className="mt-1 flex items-end border-b border-border">
        <div className="flex min-w-0 flex-1 items-end [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
            New User
          </button>
        </div>
      </div>

      <div className="mb-2 mt-3">
        <UsersToolbar search={search} onSearchChange={setSearch} />
      </div>

      <div className="flex flex-col gap-4">
        <UsersGrid
          loading={loading}
          users={users}
          totalFiltered={totalFiltered}
          search={search}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />

        <UsersPagination
          totalCount={totalFiltered}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <UserFormModal
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) clearValidationErrors();
        }}
        mode="create"
        title="Create new user"
        description="Add a team member. They will receive a reset code by email."
        submitLabel="Create user"
        isSubmitting={isSubmitting}
        formData={formData}
        onFormChange={setFormData}
        validationErrors={validationErrors}
        onSubmit={handleSubmitCreate}
        idPrefix="create"
      />

      <UserFormModal
        open={showEdit}
        onOpenChange={(open) => {
          setShowEdit(open);
          if (!open) clearValidationErrors();
        }}
        mode="edit"
        title="Edit user"
        description={
          selectedUser
            ? `Update profile for ${selectedUser.email}`
            : "Update user details"
        }
        submitLabel="Save changes"
        isSubmitting={isSubmitting}
        formData={formData}
        onFormChange={setFormData}
        validationErrors={validationErrors}
        onSubmit={handleSubmitEdit}
        idPrefix="edit"
      />

      <DeleteUserModal
        open={showDelete}
        onOpenChange={setShowDelete}
        user={selectedUser}
        isSubmitting={isSubmitting}
        onConfirm={handleSubmitDelete}
      />

      <UserStatusConfirmModal
        open={showStatusConfirm}
        onOpenChange={(open) => {
          setShowStatusConfirm(open);
          if (!open) setSelectedUser(null);
        }}
        user={selectedUser}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmToggleStatus}
      />
    </div>
  );
}
