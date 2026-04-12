"use client";

import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useRole } from "@/components/providers/role-provider";
import {
  BookOpen,
  Download,
  Edit2,
  FileBox,
  Loader2,
  Plus,
  Trash2,
  X,
  FileText,
  UploadCloud,
  AlertCircle,
  BookPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { PaginationFooter } from "@/components/common/pagination-footer";
import { fetchFromBackend } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface KnowledgeGuide {
  id: number;
  name: string;
  description: string;
  fileUrl?: string;
  date?: string;
}

interface GuideFormState {
  name: string;
  description: string;
  file: File | null;
}

const initialForm: GuideFormState = {
  name: "",
  description: "",
  file: null,
};

export default function GuidesPage() {
  const { role } = useRole();
  const normalizedRole = role?.toString().toLowerCase();
  const isAgent = normalizedRole === "agent";
  const canManage = !isAgent;

  const [guides, setGuides] = useState<KnowledgeGuide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeGuide, setActiveGuide] = useState<KnowledgeGuide | null>(null);
  const [formState, setFormState] = useState<GuideFormState>(initialForm);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeGuide | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const fetchGuides = async () => {
    try {
      setIsLoading(true);
      const result = await fetchFromBackend("/knowledge?page=1&limit=200");
      const items = Array.isArray(result) ? result : result?.data || [];
      setGuides(items);
    } catch (error) {
      console.error("Failed to load guides", error);
      setGuides([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
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
    setActiveGuide(null);
  };

  const openCreate = () => {
    setFormMode("create");
    resetForm();
    setShowForm(true);
  };

  const openEdit = (guide: KnowledgeGuide) => {
    setFormMode("edit");
    setActiveGuide(guide);
    setFormState({
      name: guide.name,
      description: guide.description,
      file: null,
    });
    setValidationErrors({});
    setShowForm(true);
  };

  const getDownloadUrl = (guide: KnowledgeGuide) => {
    if (!guide.fileUrl) return null;
    return `${apiBase}/knowledge/${guide.id}/download`;
  };

  const getFileName = (fileUrl?: string) => {
    if (!fileUrl) return "No file";
    const parts = fileUrl.split("/");
    return parts[parts.length - 1] || "file";
  };

  const formTitle = formMode === "create" ? "Add Guide" : "Edit Guide";
  const formDescription =
    formMode === "create"
      ? "Create a new operational guide with optional attachment."
      : "Update the selected guide details and file.";

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};
    if (!formState.name.trim()) {
      errors.name = "Name is required";
    }
    if (!formState.description.trim()) {
      errors.description = "Description is required";
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
          ? "/api/knowledge"
          : `/api/knowledge/${activeGuide?.id}`;
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
              ? "Guide created successfully"
              : "Guide updated successfully",
        });
        setShowForm(false);
        resetForm();
        await fetchGuides();
      } else {
        toast({
          title: "Error",
          description: result?.message || "Failed to save guide",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Guide save error", error);
      toast({
        title: "Error",
        description: "An error occurred while saving the guide",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (guide: KnowledgeGuide) => {
    if (!guide) return;
    try {
      await fetchFromBackend(`/knowledge/${guide.id}`, {
        method: "DELETE",
      });
      toast({
        title: "Deleted",
        description: "Guide removed successfully",
      });
      await fetchGuides();
    } catch (error) {
      console.error("Delete guide error", error);
      toast({
        title: "Error",
        description:
          (error as any)?.message ||
          "An error occurred while deleting the guide",
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (guide: KnowledgeGuide) => {
    setDeleteTarget(guide);
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

  const sortedGuides = useMemo(() => {
    return [...guides].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [guides]);

  const totalPages = Math.ceil(sortedGuides.length / itemsPerPage);
  const paginatedGuides = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedGuides.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedGuides, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [guides]);

  return (
    <div className="p-6 space-y-6 bg-background min-h-screen text-foreground">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            Operational Guides
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Handbooks, tutorials and operating instructions for agents.
          </p>
        </div>
        {canManage && (
          <Button onClick={openCreate} className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            New Guide
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
          <p>Loading knowledge base...</p>
        </div>
      ) : sortedGuides.length === 0 ? (
        <Card className="border-dashed border-2 border-muted bg-muted/5">
          <CardContent className="py-20 flex flex-col items-center text-center gap-4">
            <div className="p-4 rounded-full bg-muted/50">
              <BookOpen className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">No guides available</h3>
              <p className="text-muted-foreground max-w-sm">
                There are no operational guides uploaded yet. Create the first
                one to help your team.
              </p>
            </div>
            {canManage && (
              <Button onClick={openCreate} variant="outline" className="mt-2">
                <Plus className="h-4 w-4 mr-2" /> Create Guide
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedGuides.map((guide) => {
              const downloadUrl = getDownloadUrl(guide);
              return (
                <Card
                  key={guide.id}
                  className="bg-card border-border hover:border-primary/40 hover:shadow-md transition-all group flex flex-col"
                >
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                      <FileBox className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle
                        className="text-base font-semibold leading-tight truncate"
                        title={guide.name}
                      >
                        {guide.name}
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                        <span className="truncate max-w-[150px]">
                          {guide.fileUrl
                            ? getFileName(guide.fileUrl)
                            : "No file attached"}
                        </span>
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {guide.description}
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
                          onClick={() => openEdit(guide)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => openDeleteDialog(guide)}
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
            totalCount={sortedGuides.length}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
            onPageChange={setCurrentPage}
            itemLabel="guides"
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
                  <BookPlus className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1 mt-0.5">
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    {formTitle}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    {formDescription}
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
                    htmlFor="guide-name"
                    className="text-xs uppercase text-muted-foreground font-semibold tracking-wider"
                  >
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="guide-name"
                      placeholder="e.g. Protocol for Refund Requests"
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
                    htmlFor="guide-description"
                    className="text-xs uppercase text-muted-foreground font-semibold tracking-wider"
                  >
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="guide-description"
                    placeholder="Briefly describe what this guide is about..."
                    value={formState.description}
                    onChange={(event) => {
                      setFormState({
                        ...formState,
                        description: event.target.value,
                      });
                      setValidationErrors({
                        ...validationErrors,
                        description: "",
                      });
                    }}
                    rows={4}
                    className={cn(
                      "resize-none",
                      validationErrors.description &&
                        "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  {validationErrors.description && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />{" "}
                      {validationErrors.description}
                    </p>
                  )}
                </div>

                {/* Custom File Upload UI */}
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">
                    Attachment
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
                      id="guide-file"
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
                        htmlFor="guide-file"
                        className="cursor-pointer flex flex-col items-center gap-2 w-full h-full"
                      >
                        <div className="p-3 bg-muted rounded-full">
                          <UploadCloud className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            Click to upload a file
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, DOCX, or images (Max 10MB)
                          </p>
                        </div>
                      </Label>
                    )}
                  </div>

                  {formMode === "edit" &&
                    activeGuide?.fileUrl &&
                    !formState.file && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded border border-dashed">
                        <FileText className="h-3 w-3" />
                        <span>
                          Current file:{" "}
                          <span className="font-medium text-foreground">
                            {getFileName(activeGuide.fileUrl)}
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
                    "Create Guide"
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
              <AlertCircle className="h-5 w-5" /> Delete Guide
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
