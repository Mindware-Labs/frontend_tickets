export type PhoneLine = {
  id: number;
  phoneNumber: string;
  label: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PhoneLineFormData = {
  phoneNumber: string;
  label: string;
  isActive: boolean;
};
