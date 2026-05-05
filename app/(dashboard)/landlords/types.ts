export interface YardOption {
  id: number;
  name: string;
  commonName?: string;
  propertyAddress?: string;
  yardType?: "SAAS" | "FULL_SERVICE";
  isActive?: boolean;
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
