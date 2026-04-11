"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { fetchFromBackend } from "@/lib/api-client";
import { getCookie } from "@/lib/cookie-utils";
import { auth } from "@/lib/auth";
import type {
  AgentOption,
  CampaignOption,
  CustomerOption,
  YardOption,
} from "../types";
import { getAssigneeName } from "../utils/ticket-helpers";

export function useReferenceData() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  const [currentUser, setCurrentUser] = useState<{
    id: number;
    email?: string;
    name?: string;
    lastName?: string;
    role?: string;
  } | null>(null);

  const [yards, setYards] = useState<YardOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [phoneLines, setPhoneLines] = useState<
    { id: number; label: string | null; phoneNumber: string }[]
  >([]);

  const fetchYards = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? getCookie("auth-token") || localStorage.getItem("auth_token")
          : null;
      if (!token) return;

      const pageSize = 1000;
      let page = 1;
      let totalPages = 1;
      const allYards: any[] = [];

      do {
        const data = await fetchFromBackend(
          `/yards?page=${page}&limit=${pageSize}`,
        );
        const yardsPage = Array.isArray(data) ? data : data?.data || [];
        allYards.push(...yardsPage);

        const backendTotalPages = Number(
          Array.isArray(data) ? 1 : data?.totalPages,
        );
        totalPages =
          Number.isFinite(backendTotalPages) && backendTotalPages > 0
            ? backendTotalPages
            : yardsPage.length < pageSize
              ? page
              : page + 1;
        page += 1;
      } while (page <= totalPages);

      setYards(allYards.filter((yard: any) => yard.isActive));
    } catch (err: any) {
      console.error("Failed to load yards", err);
      if (err?.status !== 401) setYards([]);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await fetchFromBackend("/customers?page=1&limit=100000");
      const items = Array.isArray(data) ? data : data?.data || [];
      setCustomers(items);
    } catch (err) {
      console.error("Failed to load customers", err);
      setCustomers([]);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents");
      const result = await response.json();
      if (result?.success) {
        const list = result.data || [];
        setAgents(list.filter((agent: any) => agent.isActive !== false));
      } else {
        setAgents([]);
      }
    } catch (err) {
      console.error("Failed to load agents", err);
      setAgents([]);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const data = await fetchFromBackend("/campaign?page=1&limit=200");
      const list = Array.isArray(data) ? data : data?.data || [];
      setCampaigns(list.filter((campaign: any) => campaign.isActive === true));
    } catch (err) {
      console.error("Failed to load campaigns", err);
      setCampaigns([]);
    }
  };

  const fetchPhoneLines = async () => {
    try {
      const data = await fetchFromBackend("/phone-lines");
      setPhoneLines(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load phone lines", err);
      setPhoneLines([]);
    }
  };

  useEffect(() => {
    const user = auth.getUser();
    if (user) setCurrentUser(user);
  }, []);

  useEffect(() => {
    const user = auth.getUser();
    const token =
      typeof window !== "undefined"
        ? getCookie("auth-token") || localStorage.getItem("auth_token")
        : null;
    if (user && token) {
      fetchYards();
      fetchCustomers();
      fetchAgents();
      fetchCampaigns();
      fetchPhoneLines();
    }
  }, []);

  const currentUserFullName = useMemo(() => {
    if (!currentUser) return "";
    return [currentUser.name, currentUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim()
      .toLowerCase();
  }, [currentUser]);

  const currentAgent = useMemo(() => {
    if (!currentUser) return null;
    const byUser = (agents as any[]).find(
      (agent) => (agent as any).userId === currentUser.id,
    );
    if (byUser) return byUser;

    const email = currentUser.email?.toLowerCase();
    if (email) {
      const byEmail = agents.find(
        (agent: any) => (agent.email || "").toLowerCase() === email,
      );
      if (byEmail) return byEmail;
    }
    return null;
  }, [agents, currentUser]);

  const isTicketAssignedToCurrentUser = useCallback(
    (ticket: any): boolean => {
      if (!currentUser) return false;
      const assigneeName = getAssigneeName(ticket.assignedTo);
      const assignedAgentId =
        (ticket as any).agentId ?? (ticket.assignedTo as any)?.id ?? undefined;
      const assignedEmail =
        ((ticket.assignedTo as any)?.email || "").toLowerCase?.() || "";

      return (
        (!!currentAgent?.id && assignedAgentId === currentAgent.id) ||
        (!!assignedEmail &&
          (currentUser.email || "").toLowerCase() === assignedEmail) ||
        (!!currentUserFullName &&
          assigneeName.toLowerCase() === currentUserFullName)
      );
    },
    [currentUser, currentAgent, currentUserFullName],
  );

  return {
    apiBase,
    currentUser,
    currentAgent,
    currentUserFullName,
    yards,
    customers,
    agents,
    campaigns,
    phoneLines,
    isTicketAssignedToCurrentUser,
  };
}
