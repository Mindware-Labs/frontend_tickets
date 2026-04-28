"use client";

import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, FileText, User, Activity } from "lucide-react";
import { toast } from "sonner";

interface CallActionsProps {
  ticketId: string;
}

export function CallActions({ ticketId }: CallActionsProps) {
  const router = useRouter();

  const handleViewCall = () => {
    toast.success(`Opening call #${ticketId}`);
    router.push(`/calls?id=${ticketId}`);
  };

  const handleViewCustomer = () => {
    toast.success(`Loading customer information for call #${ticketId}`);
    router.push(`/customers`);
  };

  const handleViewRecentActivity = () => {
    toast.success("Navigating to recent call activity");
    router.push(`/calls`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 hover:bg-secondary rounded-xl"
        >
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-2xl p-2 shadow-xl border-border/50 backdrop-blur-xl"
      >
        <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
          Actions
        </DropdownMenuLabel>
        <DropdownMenuItem
          onClick={handleViewCall}
          className="rounded-xl px-3 py-2 cursor-pointer focus:bg-primary/10 focus:text-primary transition-colors"
        >
          <FileText className="mr-3 h-4 w-4" />
          <span>View Call</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleViewCustomer}
          className="rounded-xl px-3 py-2 cursor-pointer focus:bg-blue-500/10 focus:text-blue-500 transition-colors"
        >
          <User className="mr-3 h-4 w-4" />
          <span>View Customer</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleViewRecentActivity}
          className="rounded-xl px-3 py-2 cursor-pointer focus:bg-emerald-500/10 focus:text-emerald-500 transition-colors"
        >
          <Activity className="mr-3 h-4 w-4" />
          <span>Recent Calls Activity</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const TicketActions = CallActions;
