export type UserRole = "admin" | "agent" | "dev";

export type User = {
  id: number;
  name: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt?: string;
  lastLogin?: string;
};

export type UserFormData = {
  name: string;
  lastName: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};
