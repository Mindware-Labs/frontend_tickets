"use client";

import {
  Download,
  FileSpreadsheet,
  SlidersHorizontal,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Yard } from "./types";

type ReportHeaderProps = {
  selectedYard: Yard | null;
  startDate: string;
  endDate: string;
  canExport: boolean;
  canViewTickets: boolean;
  onOpenFilters: () => void;
  onViewAllTickets: () => void;
  onExportPDF: () => void;
  onExportExcel: () => void;
};

export function ReportHeader({
  selectedYard,
  startDate,
  endDate,
  canExport,
  canViewTickets,
  onOpenFilters,
  onViewAllTickets,
  onExportPDF,
  onExportExcel,
}: ReportHeaderProps) {
  const hasCompleteData = selectedYard && startDate && endDate;

  

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-5 border-b mb-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
          Yard Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          {hasCompleteData
            ? `${selectedYard.name} • ${startDate} to ${endDate}`
            : "Select a yard and date range to view analytics"}
            
        </p>
         {canViewTickets && (
          <Button
            variant="default"
            onClick={onViewAllTickets}
            className="gap-2 w-full sm:w-auto shadow-sm"
          >
            <Ticket className="w-4 h-4" />
            Yard Tickets
          </Button>
        )}
      </div>
      

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
        {/* Botón Principal: Destaca por ser la acción requerida para filtrar */}
        <Button
          variant="default"
          onClick={onOpenFilters}
          className="gap-2 w-full sm:w-auto shadow-sm"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Configure Report
        </Button>

       

        {canExport && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Exportar PDF: Hover semántico en tonos rojos */}
            <Button
              variant="outline"
              onClick={onExportPDF}
              className="gap-2 flex-1 sm:flex-none hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors"
            >
              <Download className="w-4 h-4" />
              PDF
            </Button>

            {/* Exportar Excel: Hover semántico en tonos verdes */}
            <Button
              variant="outline"
              onClick={onExportExcel}
              className="gap-2 flex-1 sm:flex-none hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
