export interface Yard {
  id: number;
  name: string;
  commonName: string;
  propertyAddress: string;
  contactInfo: string;
  yardLink?: string;
  notes?: string;
  yardType: "SAAS" | "FULL_SERVICE";
  isActive: boolean;
  landlord?: { id: number; name: string; email?: string; phone?: string };
  landlordId?: number | null;
  ticketCount?: number;
  totalTickets?: number;
  openTickets?: number;
  closedTickets?: number;
  lastActivity?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface YardFormData {
  name: string;
  commonName: string;
  propertyAddress: string;
  contactInfo: string;
  yardLink: string;
  notes: string;
  yardType: "SAAS" | "FULL_SERVICE";
  isActive: boolean;
}
