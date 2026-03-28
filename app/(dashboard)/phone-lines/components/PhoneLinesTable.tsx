"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Phone, Trash2 } from "lucide-react";
import { PhoneLine } from "../types";

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

interface PhoneLinesTableProps {
  loading: boolean;
  lines: PhoneLine[];
  totalFiltered: number;
  onEdit?: (line: PhoneLine) => void;
  onDelete?: (line: PhoneLine) => void;
  canManage?: boolean;
}

export function PhoneLinesTable({
  loading,
  lines,
  totalFiltered,
  onEdit,
  onDelete,
  canManage = true,
}: PhoneLinesTableProps) {
  return (
    <div className="flex-1 rounded-lg border overflow-hidden bg-background">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Phone Number</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            {canManage && (
              <TableHead className="text-right">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10">
                Loading...
              </TableCell>
            </TableRow>
          ) : totalFiltered === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-10">
                No phone lines found
              </TableCell>
            </TableRow>
          ) : (
            lines.map((line) => (
              <TableRow key={line.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">#{line.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono">{formatPhoneDisplay(line.phoneNumber)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {line.label ? (
                    <span>{line.label}</span>
                  ) : (
                    <span className="text-muted-foreground italic text-sm">
                      No label
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {line.isActive ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Inactive
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(line.createdAt).toLocaleDateString()}
                </TableCell>
                {canManage && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(line)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(line)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
