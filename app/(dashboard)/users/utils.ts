import type { User } from "./types";

export function getUserFullName(user: Pick<User, "name" | "lastName">) {
  return `${user.name} ${user.lastName}`.trim();
}

export function getUserInitials(user: Pick<User, "name" | "lastName">) {
  const first = user.name?.trim().charAt(0) ?? "";
  const last = user.lastName?.trim().charAt(0) ?? "";
  return (first + last).toUpperCase() || "?";
}

export function formatLastLogin(value?: string | null) {
  if (!value) return "Never logged in";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never logged in";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
