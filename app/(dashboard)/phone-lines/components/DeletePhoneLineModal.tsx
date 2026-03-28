"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatPhoneDisplay(digits: string): string {
  const clean =
    digits.startsWith("1") && digits.length === 11
      ? digits.slice(1)
      : digits;
  if (clean.length === 0) return digits;
  if (clean.length <= 3) return `+1 ${clean}`;
  if (clean.length <= 6) return `+1 ${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `+1 ${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
}

interface DeletePhoneLineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber?: string;
  isSubmitting: boolean;
  onConfirm: () => void;
}

export function DeletePhoneLineModal({
  open,
  onOpenChange,
  phoneNumber,
  isSubmitting,
  onConfirm,
}: DeletePhoneLineModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Phone Line</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete line{" "}
            <span className="font-semibold font-mono">
              {phoneNumber ? formatPhoneDisplay(phoneNumber) : "this line"}
            </span>
            ? Aircall webhooks from this number will no longer create tickets.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
