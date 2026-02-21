"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, User, XCircle, Ticket, Trophy, ExternalLink } from "lucide-react";

type AgentByTickets = {
  agentId: number;
  agentName: string;
  count: number;
};

type ActiveAgentsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  yardId: number | string;
  yardName: string;
  reportStartDate?: string;
  reportEndDate?: string;
  agentsByTickets: AgentByTickets[];
};

// Lógica mejorada para estilos de Rango (Badge + Barra de Progreso)
const getRankStyles = (index: number) => {
  switch (index) {
    case 0:
      return {
        badge:
          "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/50",
        progress: "bg-gradient-to-r from-amber-400 to-amber-500",
      };
    case 1:
      return {
        badge:
          "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600",
        progress: "bg-gradient-to-r from-slate-400 to-slate-500",
      };
    case 2:
      return {
        badge:
          "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800/50",
        progress: "bg-gradient-to-r from-orange-400 to-orange-500",
      };
    default:
      return {
        badge: "bg-muted text-muted-foreground border-border",
        progress: "bg-gradient-to-r from-primary/60 to-primary",
      };
  }
};

const getSheetMaxWidthClass = (cardCount: number) => {
  if (cardCount <= 1) {
    return "sm:max-w-[min(92vw,480px)]";
  }
  if (cardCount === 2) {
    return "sm:max-w-[min(92vw,840px)]";
  }
  return "sm:max-w-[min(92vw,1200px)]";
};

const getCardsGridClass = (cardCount: number) => {
  if (cardCount <= 1) {
    return "grid-cols-1";
  }
  if (cardCount === 2) {
    return "grid-cols-1 sm:grid-cols-2";
  }
  return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
};

export function ActiveAgentsModal({
  open,
  onOpenChange,
  side = "right",
  yardId,
  yardName,
  reportStartDate,
  reportEndDate,
  agentsByTickets,
}: ActiveAgentsModalProps) {
  const agents = useMemo(
    () => [...agentsByTickets].sort((left, right) => right.count - left.count),
    [agentsByTickets],
  );

  const totalTickets = useMemo(
    () => agents.reduce((sum, agent) => sum + agent.count, 0),
    [agents],
  );
  const sheetWidthClass = getSheetMaxWidthClass(agents.length);
  const cardsGridClass = getCardsGridClass(agents.length);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={`flex h-full w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden rounded-none p-0 shadow-2xl ${sheetWidthClass}`}
      >
        {/* Header de la Modal */}
        <SheetHeader className="border-b bg-card/50 px-6 py-6 backdrop-blur-sm z-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <SheetTitle className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                Active Agents
              </SheetTitle>
              <SheetDescription className="ml-14 mt-1.5 text-base">
                Showing agent activity and contribution for{" "}
                <span className="font-semibold text-foreground underline decoration-primary/30 underline-offset-4">
                  {yardName}
                </span>
              </SheetDescription>
            </div>

            {/* Badges de Resumen */}
            <div className="ml-14 sm:ml-0 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg border bg-background/50 px-3 py-1.5 shadow-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">
                  {agents.length} {agents.length === 1 ? "Agent" : "Agents"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 shadow-sm text-primary">
                <Ticket className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  {totalTickets} Tickets
                </span>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Contenido Scrolleable */}
        <ScrollArea className="min-h-0 flex-1 bg-muted/10">
          <div className="p-5 sm:p-6 lg:p-8">
            {agents.length === 0 ? (
              <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center py-24 text-center">
                <div className="mb-5 rounded-full bg-muted/50 p-5 ring-1 ring-border">
                  <XCircle className="h-12 w-12 text-muted-foreground/60" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  No active agents
                </h3>
                <p className="mt-2 text-muted-foreground">
                  No ticket activity was found for agents in this date range.
                </p>
              </div>
            ) : (
              /* CAMBIO: Grid actualizado para soportar hasta 3 columnas en pantallas grandes */
              <div className={`mx-auto grid w-full gap-5 ${cardsGridClass}`}>
                {agents.map((agent, index) => {
                  const share =
                    totalTickets > 0 ? (agent.count / totalTickets) * 100 : 0;
                  const barWidth =
                    agent.count > 0
                      ? `${Math.min(100, Math.max(share, 4))}%`
                      : "0%";
                  const rankStyles = getRankStyles(index);
                  const isTop3 = index < 3;
                  const ticketsParams = new URLSearchParams({
                    fromReport: "agent",
                    agentId: agent.agentId.toString(),
                    yardId: yardId.toString(),
                  });
                  if (reportStartDate) {
                    ticketsParams.set("reportStartDate", reportStartDate);
                  }
                  if (reportEndDate) {
                    ticketsParams.set("reportEndDate", reportEndDate);
                  }
                  if (yardName) {
                    ticketsParams.set("reportYardName", yardName);
                  }
                  const ticketsUrl = `/tickets?${ticketsParams.toString()}`;

                  return (
                    <div
                      key={agent.agentId}
                      className="group flex flex-col h-full rounded-2xl border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                    >
                      {/* Cabecera de la Tarjeta */}
                      <div className="flex items-start justify-between gap-3 min-h-[60px]">
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-lg font-bold text-foreground leading-tight"
                            title={agent.agentName}
                          >
                            {agent.agentName}
                          </p>
                          <p className="mt-1 text-xs font-mono font-medium text-muted-foreground/80">
                            ID: {agent.agentId}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`shrink-0 font-bold px-2.5 py-0.5 shadow-sm flex items-center gap-1 ${rankStyles.badge}`}
                        >
                          {isTop3 && <Trophy className="h-3 w-3" />}#{index + 1}
                        </Badge>
                      </div>

                      {/* Estadísticas y Progreso empujados al fondo */}
                      <div className="mt-auto pt-5 space-y-3 border-t border-border/50">
                        <div className="flex items-end justify-between">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Resolved
                          </p>
                          <div className="flex items-baseline gap-1.5">
                            <p className="text-3xl font-black leading-none text-foreground tracking-tighter">
                              {agent.count}
                            </p>
                            <span className="text-xs font-medium text-muted-foreground">
                              tckts
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-muted-foreground">
                              Contribution
                            </span>
                            <span className="text-foreground">
                              {share.toFixed(1)}%
                            </span>
                          </div>
                          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60 inset-shadow-sm">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${rankStyles.progress}`}
                              style={{ width: barWidth }}
                            />
                          </div>
                        </div>

                        <Button
                          asChild
                          variant="secondary"
                          className="w-full"
                        >
                          <Link
                            href={ticketsUrl}
                            onClick={() => onOpenChange(false)}
                          >
                            View tickets
                            <ExternalLink className="ml-2 h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <SheetFooter className="border-t bg-card/50 px-6 py-4 backdrop-blur-sm">
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Ranked descending by total ticket volume
            </p>
            <Button
              variant="default"
              onClick={() => onOpenChange(false)}
              className="h-10 w-full shadow-sm sm:w-auto sm:min-w-[120px]"
            >
              Done
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
