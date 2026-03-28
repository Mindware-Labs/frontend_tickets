"use client";

export interface CampaignOption {
  id: number;
  nombre: string;
}

export interface Customer {
  id: number;
  name?: string;
  phone?: string;
  note?: string;
  campaigns?: CampaignOption[];
  createdAt: string;
  ticketCount?: number;
}

export interface CustomerFormData {
  name: string;
  phone: string;
  note: string;
  campaignIds: string[];
}
