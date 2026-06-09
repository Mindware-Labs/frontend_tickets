"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Role = "Admin" | "Agent" | "Dev";

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  // isAdmin e isAgent eliminados para no condicionar la lógica de acceso
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("Admin");

  const syncRoleFromStorage = () => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("user_data");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      const normalized = String(parsed?.role || "").toLowerCase();
      if (normalized === "admin") {
        setRole("Admin");
      } else if (normalized === "agent") {
        setRole("Agent");
      } else if (normalized === "dev") {
        setRole("Dev");
      }
    } catch {
      // Ignore parsing errors and keep current role.
    }
  };

  useEffect(() => {
    syncRoleFromStorage();
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "user_data") {
        syncRoleFromStorage();
      }
    };
    const handleRoleUpdate = () => syncRoleFromStorage();
    window.addEventListener("storage", handleStorage);
    window.addEventListener("user-role-updated", handleRoleUpdate);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("user-role-updated", handleRoleUpdate);
    };
  }, []);

  const value = {
    role,
    setRole,
  };

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
}
