"use client";

export interface CampaignOption {
  id: number;
  nombre: string;
}

export interface CustomerNote {
  id: number;
  content: string;
  createdBy?: string;
  createdAt: string;
}

export interface Customer {
  id: number;
  name?: string;
  phone?: string;
  note?: string;
  notes?: CustomerNote[];
  campaigns?: CampaignOption[];
  createdAt: string;
  ticketCount?: number;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  note: string;
  pendingNotes: string[];
  campaignIds: string[];
}
