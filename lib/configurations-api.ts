import { fetchFromBackend } from "./api-client";

export interface DispositionConfig {
  id: number;
  value: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
}

export interface TicketTypeConfig {
  id: number;
  value: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CampaignOptionConfig {
  id: number;
  value: string;
  label: string;
  campaignTypeId: number;
  isActive: boolean;
  sortOrder: number;
}

export interface CampaignTypeConfig {
  id: number;
  value: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
  options: CampaignOptionConfig[];
}

// ── Dispositions ──────────────────────────────────────────────────────────────

export async function getDispositions(activeOnly = false): Promise<DispositionConfig[]> {
  const qs = activeOnly ? "?activeOnly=true" : "";
  return fetchFromBackend(`/configurations/dispositions${qs}`);
}

export async function createDisposition(data: Omit<DispositionConfig, "id" | "sortOrder"> & { sortOrder?: number }) {
  return fetchFromBackend("/configurations/dispositions", { method: "POST", body: JSON.stringify(data) });
}

export async function updateDisposition(id: number, data: Partial<DispositionConfig>) {
  return fetchFromBackend(`/configurations/dispositions/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteDisposition(id: number) {
  return fetchFromBackend(`/configurations/dispositions/${id}`, { method: "DELETE" });
}

// ── Ticket Types ──────────────────────────────────────────────────────────────

export async function getTicketTypes(activeOnly = false): Promise<TicketTypeConfig[]> {
  const qs = activeOnly ? "?activeOnly=true" : "";
  return fetchFromBackend(`/configurations/ticket-types${qs}`);
}

export async function createTicketType(data: Omit<TicketTypeConfig, "id" | "sortOrder"> & { sortOrder?: number }) {
  return fetchFromBackend("/configurations/ticket-types", { method: "POST", body: JSON.stringify(data) });
}

export async function updateTicketType(id: number, data: Partial<TicketTypeConfig>) {
  return fetchFromBackend(`/configurations/ticket-types/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteTicketType(id: number) {
  return fetchFromBackend(`/configurations/ticket-types/${id}`, { method: "DELETE" });
}

// ── Campaign Types ────────────────────────────────────────────────────────────

export async function getCampaignTypes(activeOnly = false): Promise<CampaignTypeConfig[]> {
  const qs = activeOnly ? "?activeOnly=true" : "";
  return fetchFromBackend(`/configurations/campaign-types${qs}`);
}

export async function createCampaignType(data: { value: string; label: string; isActive?: boolean; options?: { value: string; label: string }[] }) {
  return fetchFromBackend("/configurations/campaign-types", { method: "POST", body: JSON.stringify(data) });
}

export async function updateCampaignType(id: number, data: Partial<CampaignTypeConfig>) {
  return fetchFromBackend(`/configurations/campaign-types/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteCampaignType(id: number) {
  return fetchFromBackend(`/configurations/campaign-types/${id}`, { method: "DELETE" });
}

// ── Campaign Options ──────────────────────────────────────────────────────────

export async function createCampaignOption(typeId: number, data: { value: string; label: string; isActive?: boolean; sortOrder?: number }) {
  return fetchFromBackend(`/configurations/campaign-types/${typeId}/options`, { method: "POST", body: JSON.stringify(data) });
}

export async function updateCampaignOption(id: number, data: Partial<CampaignOptionConfig>) {
  return fetchFromBackend(`/configurations/campaign-options/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function deleteCampaignOption(id: number) {
  return fetchFromBackend(`/configurations/campaign-options/${id}`, { method: "DELETE" });
}
