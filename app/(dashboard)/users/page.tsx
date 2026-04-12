"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { fetchFromBackend } from "@/lib/api-client";
import { UsersPagination } from "./components/UsersPagination";
import {
  Users,
  Search,
  Plus,
  Loader2,
  MoreVertical,
  Edit2,
  Trash2,
  Shield,
  UserCog,
  Mail,
  CheckCircle2,
  Ban,
  UserPlus,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type UserRole = "admin" | "agent";

type User = {
  id: number;
  name: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  lastLogin?: string;
};

type FormState = {
  name: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

const DEFAULT_FORM: FormState = {
  name: "",
  lastName: "",
  email: "",
  role: "agent",
  isActive: true,
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormState>(DEFAULT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6); // Grid view: multiples of 6

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchFromBackend("/users?page=1&limit=500");
      const items = Array.isArray(data) ? data : data?.data || [];
      setUsers(items);
    } catch (error) {
      console.error("Error fetching users:", error);
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

  // Close all modals when route changes
  const pathname = usePathname();
  useEffect(() => {
    setShowCreate(false);
    setShowEdit(false);
  }, [pathname]);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.role.toLowerCase().includes(term)
      );
    });
  }, [users, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const resetForm = () => setFormData(DEFAULT_FORM);
  const clearValidationErrors = () => setValidationErrors({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    if (!formData.role) errors.role = "Role is required";
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
    setValidationErrors({});
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
        title: "User created successfully",
        description: resetCode
          ? `Reset code (dev): ${resetCode}`
          : "A reset code has been sent to the user's email.",
      });

      setShowCreate(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!selectedUser) return;
    setValidationErrors({});
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
        title: "User updated",
        description: "User details saved successfully.",
      });
      setShowEdit(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
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
      await fetchFromBackend(`/users/${selectedUser.id}`, {
        method: "DELETE",
      });
      toast({
        title: "User deleted",
        description: "User removed successfully.",
      });
      setShowDelete(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
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
        title: user.isActive ? "User blocked" : "User activated",
        description: `${user.email} is now ${
          user.isActive ? "blocked" : "active"
        }.`,
      });
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" />
            Team Members
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage system access, roles, and account status.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-9 bg-card border-border focus-visible:ring-primary text-foreground placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={handleCreate} className="gap-2 shadow-sm">
            <UserPlus className="h-4 w-4" />
            New User
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          <p>Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card className="border-dashed border-2 border-muted bg-muted/5">
          <CardContent className="py-20 flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-full bg-muted/50">
              <Users className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">No users found</h3>
              <p className="text-muted-foreground max-w-sm">
                Try adjusting your search terms or create a new user to get
                started.
              </p>
            </div>
            {!search && (
              <Button onClick={handleCreate} variant="outline" className="mt-2">
                <Plus className="h-4 w-4 mr-2" /> Add First User
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedUsers.map((user) => (
              <Card
                key={user.id}
                className="bg-card border-border hover:border-primary/40 hover:shadow-md transition-all group relative overflow-hidden"
              >
                {/* Status Indicator Stripe */}
                <div
                  className={cn(
                    "absolute top-0 left-0 w-1 h-full",
                    user.isActive ? "bg-emerald-500" : "bg-destructive",
                  )}
                />

                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pl-6">
                  <div className="flex gap-3 items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
                      {user.name.charAt(0)}
                      {user.lastName.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold">
                        {user.name} {user.lastName}
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5 flex items-center gap-1.5">
                        <Badge
                          variant="secondary"
                          className="px-1.5 py-0 h-5 text-[10px] uppercase tracking-wider font-semibold"
                        >
                          {user.role}
                        </Badge>
                        <span
                          className={cn(
                            "text-[10px] font-medium flex items-center gap-1",
                            user.isActive
                              ? "text-emerald-600"
                              : "text-destructive",
                          )}
                        >
                          {user.isActive ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Ban className="h-3 w-3" />
                          )}
                          {user.isActive ? "Active" : "Blocked"}
                        </span>
                      </CardDescription>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 -mr-2"
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(user)}>
                        <Edit2 className="h-4 w-4 mr-2" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(user)}
                      >
                        {user.isActive ? (
                          <Ban className="h-4 w-4 mr-2" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        {user.isActive ? "Block Access" : "Unblock Access"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(user)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>

                <CardContent className="pl-6 pt-2 pb-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded border border-dashed">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {user.lastLogin
                        ? `Last login: ${new Date(user.lastLogin).toLocaleString()}`
                        : "Never logged in"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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
        </>
      )}

      {/* Create Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Create New User
            </DialogTitle>
            <DialogDescription>
              Add a new member to the team. They will receive a reset code via
              email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">
                  First Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-name"
                  placeholder="John"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className={cn(validationErrors.name && "border-destructive")}
                />
                {validationErrors.name && (
                  <p className="text-xs text-destructive">
                    {validationErrors.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-lastname">
                  Last Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="create-lastname"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  className={cn(
                    validationErrors.lastName && "border-destructive",
                  )}
                />
                {validationErrors.lastName && (
                  <p className="text-xs text-destructive">
                    {validationErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="create-email"
                type="email"
                placeholder="john.doe@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className={cn(validationErrors.email && "border-destructive")}
              />
              {validationErrors.email && (
                <p className="text-xs text-destructive">
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                Role Assignment <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, role: "agent" }))
                  }
                  className={cn(
                    "cursor-pointer border rounded-lg p-3 flex flex-col gap-1 transition-all hover:border-primary/50",
                    formData.role === "agent"
                      ? "bg-primary/5 border-primary ring-1 ring-primary/20"
                      : "bg-card",
                  )}
                >
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <UserCog className="h-4 w-4" /> Agent
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Limited access to assigned tasks.
                  </p>
                </div>
                <div
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, role: "admin" }))
                  }
                  className={cn(
                    "cursor-pointer border rounded-lg p-3 flex flex-col gap-1 transition-all hover:border-primary/50",
                    formData.role === "admin"
                      ? "bg-primary/5 border-primary ring-1 ring-primary/20"
                      : "bg-card",
                  )}
                >
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <Shield className="h-4 w-4" /> Admin
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Full system control.
                  </p>
                </div>
              </div>
              {validationErrors.role && (
                <p className="text-xs text-destructive">
                  {validationErrors.role}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreate(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitCreate} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>
              Update information for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">First Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastname">Last Name</Label>
                <Input
                  id="edit-lastname"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) =>
                    setFormData((prev) => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.isActive ? "active" : "blocked"}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: value === "active",
                    }))
                  }
                >
                  <SelectTrigger
                    className={cn(
                      formData.isActive
                        ? "text-emerald-600"
                        : "text-destructive",
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active" className="text-emerald-600">
                      Active
                    </SelectItem>
                    <SelectItem value="blocked" className="text-destructive">
                      Blocked
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEdit(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitEdit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{" "}
              <span className="font-medium text-foreground">
                {selectedUser?.name} {selectedUser?.lastName}
              </span>
              ?
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmitDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
