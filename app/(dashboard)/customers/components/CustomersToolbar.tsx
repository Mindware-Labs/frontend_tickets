// components/customers/CustomersToolbar.tsx
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  RefreshCw, 
  Search, 
  ListFilter,
  Users,
  X
} from "lucide-react";

interface CustomersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onCreate?: () => void;
  canCreate?: boolean;
  totalCount: number;
  selectedCount?: number;
  onClearSelection?: () => void;
  onAssignCampaign?: () => void;
}

export function CustomersToolbar({
  search,
  onSearchChange,
  onRefresh,
  onCreate,
  canCreate = true,
  totalCount,
  selectedCount = 0,
  onClearSelection,
  onAssignCampaign,
}: CustomersToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="space-y-3">
      {/* Barra principal de búsqueda y acciones */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search customers by name, phone, or campaign..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        
        <Button
          variant="outline"
          className="h-10 px-4 rounded-xl text-slate-600 hover:text-slate-900 border-slate-200 shadow-none"
        >
          <ListFilter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-xl border-slate-200 shadow-none"
          onClick={onRefresh}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        
        {canCreate && onCreate && (
          <Button
            onClick={onCreate}
            className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-all"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Customer
          </Button>
        )}
        
        <div className="text-sm text-slate-500 whitespace-nowrap">
          {totalCount} customer{totalCount !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Barra de acciones en lote - aparece solo cuando hay selección */}
      {hasSelection && (
        <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-600 text-white hover:bg-blue-700 px-3 py-1">
              {selectedCount} selected
            </Badge>
            <span className="text-sm text-slate-700 font-medium">
              {selectedCount} customer{selectedCount !== 1 ? "s" : ""} selected
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-lg text-slate-600 border-slate-200 shadow-none text-xs"
              onClick={onAssignCampaign}
            >
              <Users className="h-3.5 w-3.5 mr-1.5" />
              Assign to Campaign
            </Button>
            
           
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}