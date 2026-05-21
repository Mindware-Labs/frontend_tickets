"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { CheckCircle2, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchFromBackend } from "@/lib/api-client";
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
const UserSheet = dynamic(
  () => import("./components/UserSheet").then((m) => m.UserSheet),
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
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const userIdParam = searchParams?.get("userId");
  const userIdFilter = userIdParam ? Number(userIdParam) : null;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState<UserView>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showUserSheet, setShowUserSheet] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchFromBackend("/users?page=1&limit=500");
      const items = Array.isArray(data) ? data : data?.data || [];
      setUsers(items);
    } catch {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    setShowCreate(false);
    setShowEdit(false);
    setShowDelete(false);
    setShowUserSheet(false);
  }, [pathname]);

  useEffect(() => {
    if (!userIdFilter || loading || users.length === 0) return;
    const match = users.find((u) => u.id === userIdFilter);
    if (match) {
      setSelectedUser(match);
      setShowUserSheet(true);
    }
  }, [userIdFilter, loading, users.length]);

  const handleUserSheetOpenChange = (open: boolean) => {
    setShowUserSheet(open);
    if (!open) {
      setSelectedUser(null);
      if (userIdParam) {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("userId");
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      }
    }
  };

  const viewCounts = useMemo(() => {
    const base = users.filter((user) => {
      const term = search.toLowerCase();
      if (!term) return true;
      return (
        user.name.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      );
    });

    return {
      all: base.length,
      active: base.filter((u) => u.isActive).length,
      blocked: base.filter((u) => !u.isActive).length,
      admin: base.filter((u) => u.role === "admin").length,
      agent: base.filter((u) => u.role === "agent").length,
    };
  }, [users, search]);

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => {
        const term = search.toLowerCase();
        const matchesSearch =
          !term ||
          user.name.toLowerCase().includes(term) ||
          user.lastName.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.role.toLowerCase().includes(term);

        const matchesView =
          activeView === "all" ||
          (activeView === "active" && user.isActive) ||
          (activeView === "blocked" && !user.isActive) ||
          (activeView === "admin" && user.role === "admin") ||
          (activeView === "agent" && user.role === "agent");

        const matchesQuery = userIdFilter ? user.id === userIdFilter : true;

        return matchesSearch && matchesView && matchesQuery;
      })
      .sort((a, b) => a.id - b.id);
  }, [users, search, activeView, userIdFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeView, userIdFilter, itemsPerPage]);

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

  const handleOpen = (user: User) => {
    setSelectedUser(user);
    setShowUserSheet(true);
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
      await fetchUsers();
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
      await fetchUsers();
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
      await fetchUsers();
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

  const handleToggleStatus = async (user: User) => {
    try {
      await fetchFromBackend(`/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      toast({
        title: "Success",
        description: `${user.email} is now ${user.isActive ? "blocked" : "active"}.`,
      });
      await fetchUsers();
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast({
        title: "Error",
        description: err.message || "Failed to update user status",
        variant: "destructive",
      });
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

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
        <UsersGrid
          loading={loading}
          users={paginatedUsers}
          totalFiltered={filteredUsers.length}
          search={search}
          onCreate={handleCreate}
          onOpen={handleOpen}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDelete}
        />

        <UsersPagination
          totalCount={filteredUsers.length}
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

      <UserSheet
        open={showUserSheet}
        onOpenChange={handleUserSheetOpenChange}
        user={selectedUser}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDelete}
      />
    </div>
  );
}
