import { cn } from "@/lib/utils";

/** App shell tokens — shared with login, dashboard, calls. */
export const appCanvasClass = "bg-[#f4f5f7] dark:bg-slate-950";

export const appPanelClass =
  "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)] dark:border-slate-800 dark:bg-slate-950";

export const sidebarCanvasClass = appCanvasClass;

export const sidebarShellClass = cn(appPanelClass, "flex h-full min-h-0 flex-col overflow-hidden");

export const sidebarBrandClass =
  "relative shrink-0 overflow-hidden border-b border-white/10 bg-gradient-to-br from-[#008f68] via-[#007a5a] to-[#065f4a]";

export const sidebarBrandPatternClass =
  "pointer-events-none absolute inset-0 opacity-[0.1] [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:20px_20px]";

export const sidebarNavClass =
  "scrollbar-app min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2";

export const sidebarSectionLabelClass =
  "mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500";

export const sidebarItemBaseClass =
  "group relative flex w-full items-center rounded-lg text-[12px] font-medium leading-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25";

export const sidebarItemIdleClass =
  "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100";

export const sidebarItemActiveClass =
  "bg-[#f0faf5] font-semibold text-[#008f68] shadow-[0_1px_2px_rgba(0,143,104,0.06)] dark:bg-emerald-500/10 dark:text-emerald-400";

export const sidebarActiveBarClass =
  "before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-[#008f68] before:content-['']";

/** Topbar — matches sidebar shell + dashboard headers. */
export const topbarWrapClass = "sticky top-0 z-40 shrink-0 px-3 pt-3 sm:px-4 lg:px-5";

export const topbarShellClass = cn(
  appPanelClass,
  "relative flex h-12 items-center justify-between gap-3 px-3 sm:px-4",
);

export const topbarAccentLineClass =
  "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent";

export const topbarSectionLabelClass = sidebarSectionLabelClass;

export const topbarTitleClass =
  "truncate text-[15px] font-bold leading-tight tracking-[-0.02em] text-slate-900 dark:text-slate-100";

export const topbarAccentBarClass = "h-7 w-0.5 shrink-0 rounded-full bg-[#008f68]";

export const topbarActionsGroupClass =
  "flex shrink-0 items-center gap-0.5 rounded-lg border border-slate-200/60 bg-slate-100/80 p-0.5 dark:border-slate-800 dark:bg-slate-900/80";

export const topbarIconBtnClass = cn(
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
  "text-slate-500 hover:bg-white hover:text-slate-800",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25",
  "dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
);

export const topbarUserBtnClass = cn(
  "flex max-w-[220px] items-center gap-2 rounded-lg border border-slate-200/80 bg-white py-1 pl-1 pr-2",
  "shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:border-slate-300 hover:bg-slate-50",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#008f68]/25",
  "dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800",
);

export const topbarDropdownClass = cn(
  appPanelClass,
  "w-64 rounded-xl border p-1.5 shadow-lg backdrop-blur-sm",
);
