# Rig Hut Support Center — Design System

Guía de diseño para **Frontend-Tickets-hut** (Next.js + Tailwind v4 + shadcn/ui). Objetivo: vistas **modernas, compactas y consistentes** (dashboard, calls, sidebar, formularios, tablas).

Usar este documento cuando un agente o desarrollador cree **nuevas pantallas, modales, tablas o componentes**.

---

## 1. Principios

| Principio | Descripción |
|-----------|-------------|
| **Compacto** | Alturas de control ~`h-8`–`h-9`, padding reducido, tipografía 10–13px en UI densa. |
| **Panel sobre canvas** | Fondo gris suave + tarjetas blancas con borde y sombra ligera. |
| **Teal como marca** | Acento primario `#008f68`, hover `#007a5a`. |
| **Jerarquía por tipografía** | Labels en `uppercase` + `tracking-widest`, títulos en bold, cuerpo en slate. |
| **Reutilizar tokens** | Importar clases desde archivos de tema antes de inventar utilidades nuevas. |

---

## 2. Paleta y tokens

### 2.1 Colores principales

| Token | Hex / valor | Uso |
|-------|-------------|-----|
| **Canvas** | `#f4f5f7` | Fondo de app, scroll de formularios, área detrás de paneles |
| **Primary** | `#008f68` | Botones primarios, íconos activos, barras de acento, links |
| **Primary hover** | `#007a5a` | Hover de botones y gradientes de marca |
| **Primary deep** | `#065f4a` | Extremo de gradientes (sidebar brand) |
| **Active surface** | `#f0faf5` | Fondo de ítem activo en nav / focus suave |
| **Border** | `slate-200/80` | Bordes de paneles y inputs en reposo |
| **Text primary** | `slate-900` | Títulos y valores |
| **Text secondary** | `slate-500`–`slate-600` | Descripciones, hints |
| **Text muted label** | `slate-400` | Section labels, table headers |

### 2.2 CSS variables (shadcn)

Definidas en `Frontend-Tickets-hut/app/globals.css`:

- `--primary` → teal (`160 100% 28%`, equivalente a `#008f68`)
- `--radius: 0.75rem` (12px base)
- Scrollbars: `--scrollbar-size: 5px`, thumb con hover teal

### 2.3 Modo oscuro

- Canvas: `slate-950`
- Paneles: `slate-950` + `border-slate-800`
- Texto activo teal: `emerald-400` / `emerald-500/10` en fondos
- **Logo**: `CenterQuestMark` oculto en dark (`dark:hidden`); usar monograma **CQ** en sidebar si hace falta

---

## 3. Tipografía

**Fuente:** Inter (`app/layout.tsx`, variable `--font-inter`).

| Rol | Clases típicas | Tamaño |
|-----|----------------|--------|
| **Section label** | `text-[10px] font-semibold uppercase tracking-widest text-slate-400` | 10px |
| **Field label (forms)** | `text-[11px] font-semibold uppercase tracking-wider text-slate-500` | 11px |
| **Nav / tabla densa** | `text-[12px] font-medium` | 12px |
| **Cuerpo UI** | `text-xs` (12px) o `text-sm` (14px) | 12–14px |
| **Título topbar** | `text-[15px] font-bold tracking-[-0.02em]` | 15px |
| **Título página (calls)** | `text-2xl font-bold tracking-tight` | 24px |
| **Título panel / dialog** | `text-[15px] font-semibold` | 15px |
| **KPI valor** | `text-lg`–`text-xl font-bold tabular-nums` | 18–20px |
| **KPI label** | `text-[9px] font-semibold uppercase tracking-wide` | 9px |

---

## 4. Espaciado y radios

| Elemento | Valor |
|--------|--------|
| **Gap entre paneles (dashboard)** | `gap-2` (8px) |
| **Padding panel body** | `px-3 py-2.5` o `px-3.5 py-3` |
| **Padding layout main** | `px-3 pt-2` → `lg:px-5 lg:pb-8` |
| **Radius panel grande** | `rounded-2xl` |
| **Radius panel / card mediano** | `rounded-xl` |
| **Radius control / botón** | `rounded-lg` |
| **Radius ícono / chip** | `rounded-md` |
| **Altura input compacto** | `h-9` |
| **Altura topbar shell** | `h-12` (48px) |
| **Altura toolbar dashboard** | `min-h-[56px]` |

---

## 5. Superficies (surfaces)

### 5.1 Canvas

```txt
bg-[#f4f5f7] dark:bg-slate-950
```

**Archivo:** `components/layout/sidebar-theme.ts` → `appCanvasClass`  
**Dashboard:** `dashboard-theme.ts` → `dashboardCanvasClass` (`rounded-xl bg-[#f4f5f7] p-2`)

### 5.2 Panel / tarjeta estándar

```txt
overflow-hidden rounded-2xl border border-slate-200/80 bg-white
shadow-[0_1px_3px_rgba(0,0,0,0.06)]
dark:border-slate-800 dark:bg-slate-950
```

**Archivos:**

- `sidebar-theme.ts` → `appPanelClass`
- `dashboard-theme.ts` → `dashboardPanelClass`
- `entity-form-layout.tsx` → `EntityFormCard` (misma sombra/borde)

### 5.3 Línea de acento superior (opcional)

```txt
h-px bg-gradient-to-r from-transparent via-[#008f68]/45 to-transparent
```

Usada en topbar (`topbarAccentLineClass`).

### 5.4 Barra vertical de acento (títulos)

```txt
h-7 w-0.5 shrink-0 rounded-full bg-[#008f68]
```

Topbar, headers alineados con sidebar.

---

## 6. App shell (layout global)

### 6.1 Estructura

```
SidebarProvider
├── AppSidebar (canvas + paneles blancos)
└── SidebarInset (canvas)
    ├── Topbar (panel flotante sticky)
    └── main (contenido de página)
```

**Archivo:** `components/layout/dashboard-layout.tsx`

### 6.2 Sidebar

**Archivos:** `components/layout/sidebar.tsx`, `sidebar-theme.ts`

- Ancho expandido: `16rem` (`components/ui/sidebar.tsx` → `SIDEBAR_WIDTH`)
- Modo icono: `3rem`
- Padding contenedor: `p-2`
- Secciones en **tarjetas** `rounded-xl` separadas (Communications, Operations, Reports, …)
- **Submenús** (children) solo donde aplique: Campaigns, Yards, Landlords → ítem + Reports anidado
- **Contact Center** (`/calls`): nombre que agrupa Calls, Tickets y Manual Records en tabs internos

**Ítem de navegación**

| Estado | Estilos |
|--------|---------|
| Idle | `text-slate-600 hover:bg-slate-50`, `h-8`, `rounded-lg`, `text-[12px]` |
| Active | `bg-[#f0faf5] text-[#008f68] font-semibold` + barra izquierda `before:w-0.5 before:bg-[#008f68]` |
| Ícono | `14px`, stroke `2`, activo teal / idle `slate-400` |

**Section label:** `sidebarSectionLabelClass` (10px uppercase).

### 6.3 Topbar

**Archivo:** `components/layout/topbar.tsx`

- Wrapper: `sticky top-0`, padding `px-3 pt-3`
- Shell: `appPanelClass` + `h-12`
- Izquierda: `SidebarTrigger` (mobile) + barra teal + section label + título
- Derecha: grupo de acciones `bg-slate-100/80 rounded-lg border p-0.5`
  - NotificationBell, menú usuario (`rounded-lg` border blanco)
- **No** usar `dynamic(..., { ssr: false })` en componentes con Radix en el mismo árbol (provoca hydration mismatch en IDs)

### 6.4 Scrollbars

Clases utilitarias en `globals.css`:

- `.scrollbar-app` — fino, thumb slate/teal
- `.scrollbar-app-hover` — thumb más visible al hover del contenedor

Usar en sidebars, tablas largas y cuerpos de formulario.

---

## 7. Controles segmentados (tabs)

Patrón estándar para Dashboard, Calls, Reports:

**Contenedor**

```txt
flex rounded-lg bg-slate-100 p-1
border border-slate-200/80 shadow-sm (opcional en calls)
dark:bg-slate-900/80
min-w-[280px] (o w-full en mobile)
```

**Tab activo**

```txt
rounded-md bg-white font-semibold text-[#008f68] shadow-sm
dark:bg-slate-950 dark:text-emerald-400
px-3 py-1.5 text-xs
```

**Tab inactivo**

```txt
text-slate-500 hover:text-slate-800
dark:text-slate-400
```

**Referencia:** `dashboard-header.tsx`, `yard-dashboard-chrome.tsx` (`YardSegmentedTabs`), `calls/page.tsx` (Contact Center tabs).

---

## 8. Formularios (entity forms)

**Archivo principal:** `components/forms/entity-form-layout.tsx`

### 8.1 Modal / dialog

| Parte | Especificación |
|-------|----------------|
| Contenedor | `rounded-2xl`, `max-w-[760px]`, `p-0`, sombra `shadow-2xl` |
| Header | Borde inferior, ícono en círculo `h-11`, título `15px semibold` |
| Body scroll | `entityFormScrollBodyClass` → canvas `#f4f5f7`, `max-h-[68dvh]`, `.scrollbar-app` |
| Footer | `bg-slate-50/80`, botones `h-11 rounded-lg` |

### 8.2 Inputs

```txt
h-9 rounded-lg border border-transparent bg-slate-50 px-2.5 text-xs
hover:border-slate-300
focus:border-[#008f68] focus:bg-white focus:ring-2 focus:ring-[#008f68]/20
```

Exportados como: `entityFormInputClassName`, `entityFormTextareaClassName`, `entityFormSelectTriggerClassName`.

### 8.3 Labels y secciones

- **Sección:** `EntityFormSectionHeading` — 10px uppercase widetrack
- **Campo:** `EntityFormField` + `EntityFormFieldLabel` — 11px uppercase, `*` rojo si required
- **Error:** `text-[11px] text-red-500`
- **Grid:** `EntityFormGrid` → `grid-cols-2 gap-x-3 gap-y-2.5`

### 8.4 Tarjeta dentro del form

`EntityFormCard`: mismo borde/sombra que `dashboardPanelClass`, header con ícono `h-5 w-5` en `bg-slate-100`, título `12px bold`.

### 8.5 Botones de formulario

| Tipo | Estilo |
|------|--------|
| Primary create | `bg-[#008f68] hover:bg-[#007a5a] h-11 rounded-lg` |
| Primary edit | `bg-slate-700` (neutral) |
| Cancel | `variant="outline"`, borde slate, fondo blanco |

---

## 9. Tablas

### 9.1 Dashboard / analytics

**Archivo:** `dashboard-theme.ts`

| Elemento | Clases |
|----------|--------|
| Header | `dashboardTableHeadClass` — `text-[10px] uppercase tracking-wider text-slate-400 py-2` |
| Celda | `dashboardTableCellClass` — `text-xs text-slate-600 py-2` |
| Celda énfasis | `dashboardTableCellStrongClass` — `text-xs font-semibold text-slate-800` |

### 9.2 Listas operativas (calls, records)

- Header de tabla **sticky** (`sticky top-0 z-10 bg-background`)
- Columnas con `min-w-[...]` para evitar colapso
- Densidad alta: padding vertical `py-2` en celdas
- Contenedor con scroll horizontal si hace falta

**Referencia:** `components/records/UnifiedRecordsList.tsx`

### 9.3 Reglas

- No mezclar tamaños de fuente arbitrarios; mantener `text-xs` en celdas.
- Acciones en columna fija `w-[120px]` cuando existan botones por fila.
- Estados vacíos: mensaje centrado dentro del panel, no fuera del canvas.

---

## 10. Dashboard y KPIs

**Archivo:** `app/(dashboard)/dashboard/dashboard-theme.ts`

### 10.1 Layout

- Shell: `dashboardShellClass` → `flex flex-col gap-2`
- Filas: `dashboardRowClass` o `dashboardPairedRowClass` (2 columnas en `xl`)
- Altura de gráficos fija: `220px` / `200px` (`DASHBOARD_CHART_HEIGHT`)

### 10.2 Panel con header

```txt
dashboardPanelClass
dashboardPanelHeaderClass  → border-b px-3.5 py-2
dashboardPanelBodyClass    → px-3 py-2.5
```

### 10.3 Superficie de gráfico

```txt
dashboardChartSurfaceClass
rounded-xl border border-slate-100 bg-slate-50/60 p-1.5
```

### 10.4 Metric cards

**Archivo:** `metric-card.tsx`

- Tile: `rounded-xl border px-2.5 py-2`, tonos por semántica (emerald, sky, amber, rose, indigo, slate)
- Ícono en caja `h-8 w-8 rounded-lg`
- Label KPI: 9px uppercase; valor: `text-lg font-bold tabular-nums`

### 10.5 Filtros activos (chips)

```txt
border-emerald-100 bg-emerald-50 text-emerald-800
text-[10px] uppercase en label del filtro
botón X pequeño rounded
```

**Referencia:** `dashboard-filter-bar.tsx` → `FilterChip`, `YardContextChip`

### 10.6 Badges de estado

```txt
inline-flex rounded border px-2 py-0.5 text-xs font-semibold
+ punto size-1.5 rounded-full (verde / ámbar / slate)
```

**Referencia:** `YardStatusBadge` en `yard-dashboard-chrome.tsx`

---

## 11. Páginas tipo lista (CRUD)

Patrón usado en Customers, Yards, Campaigns, Users:

1. **Topbar** resuelve sección + título (`resolvePageMeta` en `topbar.tsx`).
2. Contenido en canvas; tabla o cards dentro de **panel blanco** `rounded-xl/2xl`.
3. Acciones primarias: botón teal `bg-[#008f68]` o shadcn `Button` con variante default.
4. Filtros: sheet lateral o barra compacta; chips de filtro activo estilo emerald.
5. Modales de crear/editar: siempre `EntityFormDialogShell`.

Al añadir ruta nueva, **actualizar** `resolvePageMeta` en `topbar.tsx` y la entrada en `sidebar.tsx`.

---

## 12. Contact Center (`/calls`)

- Sidebar: **Contact Center** → `/calls`
- Tabs internos: Calls | Tickets | Manual Records (segmented control, ver §7)
- Título de página cambia según tab activo
- Vistas secundarias bajo calls: tabs tipo “All / Active / Overdue” con estilo underline o pills según contexto

---

## 13. Páginas placeholder / coming soon

**Componente:** `components/layout/placeholder-page.tsx`

```txt
Panel max-w-2xl rounded-2xl border bg-white p-6
Label: "{Section} · Coming soon" (10px uppercase)
Título: text-xl font-bold
Descripción: text-sm text-slate-600 leading-relaxed
```

Usado en `audit/sms`, `audit/notifications`.

---

## 14. Iconografía

- **Librería:** lucide-react
- **Tamaños:** `size-3.5` (14px) en UI densa, `size-4` en botones, `15–16px` en nav
- **Stroke:** `strokeWidth={2}` en sidebar
- **Color:** `text-slate-400` idle, `text-[#008f68]` activo

---

## 15. Accesibilidad y UX

- `focus-visible:ring-2 focus-visible:ring-[#008f68]/25` en controles interactivos
- `aria-current="page"` en links de nav activos
- `aria-expanded` en grupos colapsables de sidebar
- Tooltips en sidebar colapsada (`Tooltip` + `side="right"`)
- Evitar contenido que dependa de `Date.now()` / locale en el **primer render SSR** (formatear hora en `useEffect`, ver `dashboard-tabs.tsx`)

---

## 16. Checklist para nueva vista

- [ ] Fondo de página = canvas `#f4f5f7` (heredado del layout)
- [ ] Contenido principal en panel `appPanelClass` o `dashboardPanelClass`
- [ ] Section labels 10px uppercase; datos 12px
- [ ] Botón primario teal `#008f68`
- [ ] Tabs con patrón segmented (§7)
- [ ] Tablas con headers 10px uppercase y celdas `text-xs`
- [ ] Formularios vía `entity-form-layout` exports
- [ ] Entrada en `sidebar.tsx` + `topbar.tsx` `resolvePageMeta`
- [ ] Scroll en contenedores largos con `.scrollbar-app`
- [ ] Sin `dynamic(..., { ssr: false })` junto a Radix en layout global
- [ ] Reutilizar tokens de `sidebar-theme.ts` y `dashboard-theme.ts` antes de duplicar clases

---

## 17. Archivos de referencia (mapa rápido)

| Área | Archivos |
|------|----------|
| Shell / sidebar / topbar | `components/layout/sidebar.tsx`, `sidebar-theme.ts`, `topbar.tsx`, `dashboard-layout.tsx` |
| Dashboard | `app/(dashboard)/dashboard/dashboard-theme.ts`, `dashboard-header.tsx`, `metric-card.tsx` |
| Formularios | `components/forms/entity-form-layout.tsx` |
| Tabs reutilizables | `app/(dashboard)/reports/yards/components/yard-dashboard-chrome.tsx` |
| Tokens globales | `app/globals.css` |
| UI base | `components/ui/*` (shadcn) |

---

## 18. Nombre del producto en UI

- **Center Quest** — marca en sidebar
- **Rig Hut Support Center** — contexto operativo
- Dominios internos: CCQUEST / RIG HUT (login, footer)

---
