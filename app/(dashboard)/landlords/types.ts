export interface YardOption {
  id: number;
  name: string;
  commonName?: string;
  propertyAddress?: string;
  contactInfo?: string;
  yardLink?: string;
  yardType?: "SAAS" | "FULL_SERVICE";
  isActive?: boolean;
  ticketCount?: number;
  totalTickets?: number;
  landlord?: { id: number; name: string };
}

export interface Landlord {
  id: number;
  name: string;
  phone: string;
  email: string;
  yards?: YardOption[];
  createdAt?: string;
}

export interface LandlordFormData {
  name: string;
  phone: string;
  email: string;
  yardIds: string[];
}
