export function formatPhoneDisplay(digits: string): string {
  const clean =
    digits.startsWith("1") && digits.length === 11 ? digits.slice(1) : digits;
  if (clean.length === 0) return digits;
  if (clean.length <= 3) return `+1 ${clean}`;
  if (clean.length <= 6) return `+1 ${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `+1 ${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
}

export function formatPhoneForEdit(digits: string): string {
  const clean = digits.startsWith("1") ? digits.slice(1) : digits;
  if (clean.length === 0) return "";
  if (clean.length <= 3) return `+1 ${clean}`;
  if (clean.length <= 6) return `+1 ${clean.slice(0, 3)}-${clean.slice(3)}`;
  return `+1 ${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
}

export function hasDialablePhone(phone?: string | null): boolean {
  if (!phone?.trim()) return false;
  return phone.replace(/\D/g, "").length >= 7;
}

export function formatLineDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
