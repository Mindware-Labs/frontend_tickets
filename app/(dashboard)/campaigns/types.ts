import { ManagementType } from "../calls/types";

export interface YardSummary {
  id: number;
  name: string;
}

export interface Campaign {
  id: number;
  nombre: string;
  yardaId?: number | null;
  yarda?: YardSummary | null;
  duracion?: string | null;
  tipo: ManagementType; // Enum
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  ticketCount?: number;

  // CAMPOS NUEVOS
  registeredCount?: number;
  notRegisteredCount?: number;
  paidCount?: number;
  notPaidCount?: number;
}

export interface CampaignFormData {
  nombre: string;
  yardaId?: number;
  duracion: string;
  tipo: ManagementType;
  isActive: boolean;
}
