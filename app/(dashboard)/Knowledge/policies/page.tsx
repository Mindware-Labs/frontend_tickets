"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useRole } from "@/components/providers/role-provider";
import {
  Download,
  Edit2,
  FileText,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  X,
  UploadCloud,
  AlertCircle,
  ShieldCheck,
  Shield,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { PaginationFooter } from "@/components/common/pagination-footer";
import { cn } from "@/lib/utils";

interface PolicyItem {
  id: number;
  name: string;
  description: string;
  fileUrl?: string;
  date?: string;
}

interface PolicyFormState {
  name: string;
  description: string;
  file: File | null;
}

const initialForm: PolicyFormState = {
  name: "",
  description: "",
  file: null,
};

export default function PoliciesPage() {
  const { role } = useRole();
  const normalizedRole = role?.toString().toLowerCase();
  const isAgent = normalizedRole === "agent";
  const canManage = !isAgent;

  const [search, setSearch] = useState("");
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activePolicy, setActivePolicy] = useState<PolicyItem | null>(null);
  const [formState, setFormState] = useState<PolicyFormState>(initialForm);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PolicyItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchPolicies = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/policies?page=1&limit=200");
      const result = await response.json();
      if (result?.success) {
        setPolicies(result.data || []);
      } else {
        setPolicies([]);
      }
    } catch (error) {
      console.error("Failed to load policies", error);
      setPolicies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Close all modals when route changes
  const pathname = usePathname();
  useEffect(() => {
    setShowForm(false);
    setShowDeleteDialog(false);
  }, [pathname]);

  const resetForm = () => {
    setFormState(initialForm);
    setValidationErrors({});
    setActivePolicy(null);
  };

  const openCreate = () => {
    setFormMode("create");
    resetForm();
    setShowForm(true);
  };

  const openEdit = (policy: PolicyItem) => {
    setFormMode("edit");
    setActivePolicy(policy);
    setFormState({
      name: policy.name,
      description: policy.description || "",
      file: null,
    });
    setValidationErrors({});
    setShowForm(true);
  };

  const getDownloadUrl = (policy: PolicyItem) => {
    if (!policy.fileUrl) return null;
    return `${apiBase}/policies/${policy.id}/download`;
  };

  const getFileName = (fileUrl?: string) => {
    if (!fileUrl) return "No file";
    const parts = fileUrl.split("/");
    return parts[parts.length - 1] || "file";
  };

  const filteredPolicies = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = term
      ? policies.filter((policy) => policy.name.toLowerCase().includes(term))
      : policies;
    return [...list].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [policies, search]);

  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage);
  const paginatedPolicies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredPolicies.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredPolicies, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, policies]);

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!formState.name.trim()) {
      errors.name = "Name is required";
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = new FormData();
      payload.append("name", formState.name.trim());
      payload.append("description", formState.description.trim());
      if (formState.file) {
        payload.append("file", formState.file);
      }

      const url =
        formMode === "create"
          ? "/api/policies"
          : `/api/policies/${activePolicy?.id}`;
      const method = formMode === "create" ? "POST" : "PATCH";
      const response = await fetch(url, {
        method,
        body: payload,
      });
      const result = await response.json();

      if (result?.success) {
        toast({
          title: "Success",
          description:
            formMode === "create"
              ? "Policy created successfully"
              : "Policy updated successfully",
        });
        setShowForm(false);
        resetForm();
        await fetchPolicies();
      } else {
        toast({
          title: "Error",
          description: result?.message || "Failed to save policy",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Policy save error", error);
      toast({
        title: "Error",
        description: "An error occurred while saving the policy",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (policy: PolicyItem) => {
    if (!policy) return;
    try {
      const response = await fetch(`/api/policies/${policy.id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result?.success) {
        toast({
          title: "Deleted",
          description: "Policy removed successfully",
        });
        await fetchPolicies();
      } else {
        toast({
          title: "Error",
          description: result?.message || "Failed to delete policy",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete policy error", error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the policy",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (policy: PolicyItem) => {
    setDeleteTarget(policy);
    setShowDeleteDialog(true);
  };

  const closeDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await handleDelete(deleteTarget);
    closeDeleteDialog();
  };

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen text-foreground">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-primary" />
            Rig Hut Policies
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Legal documentation, compliance rules, and official regulations.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search policies..."
              className="pl-9 bg-card border-border focus-visible:ring-primary text-foreground placeholder:text-muted-foreground"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManage && (
            <Button onClick={openCreate} className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              New Policy
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          <p>Loading policies...</p>
        </div>
      ) : filteredPolicies.length === 0 ? (
        <Card className="border-dashed border-2 border-muted bg-muted/5">
          <CardContent className="py-20 flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-full bg-muted/50">
              <ShieldCheck className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">No policies found</h3>
              <p className="text-muted-foreground max-w-sm">
                No policy documents match your search or none have been created
                yet.
              </p>
            </div>
            {canManage && !search && (
              <Button onClick={openCreate} variant="outline" className="mt-2">
                <Plus className="h-4 w-4 mr-2" /> Create Policy
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPolicies.map((policy) => {
              const downloadUrl = getDownloadUrl(policy);
              return (
                <Card
                  key={policy.id}
                  className="bg-card border-border hover:border-primary/40 hover:shadow-md transition-all group flex flex-col"
                >
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle
                        className="text-base font-semibold leading-tight truncate"
                        title={policy.name}
                      >
                        {policy.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                        <span className="truncate max-w-[150px]">
                          {policy.fileUrl
                            ? getFileName(policy.fileUrl)
                            : "No document attached"}
                        </span>
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {policy.description || "No description provided."}
                    </p>
                  </CardContent>

                  <CardFooter className="flex items-center gap-2 pt-0 pb-4">
                    <Button
                      size="sm"
                      className="flex-1 gap-2 bg-primary/90 hover:bg-primary shadow-sm"
                      onClick={() => {
                        if (downloadUrl) {
                          window.open(downloadUrl, "_blank");
                        }
                      }}
                      disabled={!downloadUrl}
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>

                    {canManage && (
                      <div className="flex gap-1 border-l pl-2 ml-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(policy)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => openDeleteDialog(policy)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <PaginationFooter
            totalCount={filteredPolicies.length}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
            onPageChange={setCurrentPage}
            itemLabel="policies"
          />
        </>
      )}

      {/* Create / Edit Dialog */}
      {canManage && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden bg-background">
            {/* Modal Header */}
            <DialogHeader className="p-6 pb-4 bg-muted/20 border-b">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 shadow-sm">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1 mt-0.5">
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    {formMode === "create" ? "Add Policy" : "Edit Policy"}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {formMode === "create"
                      ? "Create a new policy document with optional attachment."
                      : "Update the selected policy details and file."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-5">
                {/* Name Input */}
                <div className="space-y-2">
                  <Label
                    htmlFor="policy-name"
                    className="text-xs uppercase text-muted-foreground font-semibold tracking-wider"
                  >
                    Policy Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <ShieldAlert className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="policy-name"
                      placeholder="e.g. Terms of Service Update 2024"
                      value={formState.name}
                      onChange={(event) => {
                        setFormState({
                          ...formState,
                          name: event.target.value,
                        });
                        setValidationErrors({ ...validationErrors, name: "" });
                      }}
                      className={cn(
                        "pl-9",
                        validationErrors.name &&
                          "border-destructive focus-visible:ring-destructive",
                      )}
                    />
                  </div>
                  {validationErrors.name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />{" "}
                      {validationErrors.name}
                    </p>
                  )}
                </div>

                {/* Description Textarea */}
                <div className="space-y-2">
                  <Label
                    htmlFor="policy-description"
                    className="text-xs uppercase text-muted-foreground font-semibold tracking-wider"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="policy-description"
                    placeholder="Briefly describe the purpose of this policy..."
                    value={formState.description}
                    onChange={(event) => {
                      setFormState({
                        ...formState,
                        description: event.target.value,
                      });
                    }}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Custom File Upload UI */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                    Document File
                  </Label>

                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 transition-colors flex flex-col items-center justify-center text-center gap-2",
                      formState.file
                        ? "border-primary/30 bg-primary/5"
                        : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30",
                    )}
                  >
                    <Input
                      id="policy-file"
                      type="file"
                      className="hidden"
                      onChange={(event) =>
                        setFormState({
                          ...formState,
                          file: event.target.files?.[0] || null,
                        })
                      }
                    />

                    {formState.file ? (
                      <div className="w-full flex items-center justify-between gap-3 p-2 bg-background rounded border shadow-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-2 bg-primary/10 rounded">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium truncate">
                            {formState.file.name}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            setFormState({ ...formState, file: null });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Label
                        htmlFor="policy-file"
                        className="cursor-pointer flex flex-col items-center gap-2 w-full h-full"
                      >
                        <div className="p-3 bg-muted rounded-full">
                          <UploadCloud className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            Click to upload a document
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, DOCX, or images (Max 10MB)
                          </p>
                        </div>
                      </Label>
                    )}
                  </div>

                  {formMode === "edit" &&
                    activePolicy?.fileUrl &&
                    !formState.file && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded border border-dashed">
                        <FileText className="h-3 w-3" />
                        <span>
                          Current file:{" "}
                          <span className="font-medium text-foreground">
                            {getFileName(activePolicy.fileUrl)}
                          </span>
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <DialogFooter className="p-4 bg-muted/20 border-t">
              <div className="flex w-full justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : formMode === "create" ? (
                    "Create Policy"
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" /> Delete Policy
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-foreground">
                "{deleteTarget?.name}"
              </span>
              ?
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
