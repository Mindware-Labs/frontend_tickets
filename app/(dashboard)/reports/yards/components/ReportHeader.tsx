"use client";

import { Download, FileSpreadsheet, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Yard } from "./types";

type ReportHeaderProps = {
  selectedYard: Yard | null;
  startDate: string;
  endDate: string;
  canExport: boolean;
  onOpenFilters: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
};

export function ReportHeader({
  selectedYard,
  startDate,
  endDate,
  canExport,
  onOpenFilters,
  onExportPDF,
  onExportExcel,
}: ReportHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
          Yard Reports
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground mt-1">
          {selectedYard
            ? `${selectedYard.name} - ${startDate} to ${endDate}`
            : "Select a yard to view analytics"}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button variant="outline" onClick={onOpenFilters} className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Configure Report
        </Button>

        {canExport && (
          <>
            <Button variant="outline" onClick={onExportPDF} className="gap-2">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              onClick={onExportExcel}
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
