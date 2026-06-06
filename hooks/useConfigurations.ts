"use client";

import { useState, useEffect } from "react";
import {
  getDispositions,
  getTicketTypes,
  getCampaignTypes,
  type DispositionConfig,
  type TicketTypeConfig,
  type CampaignTypeConfig,
} from "@/lib/configurations-api";
import { getCookie } from "@/lib/cookie-utils";

export function useConfigurations(activeOnly = true) {
  const [dispositions, setDispositions] = useState<DispositionConfig[]>([]);
  const [ticketTypes, setTicketTypes] = useState<TicketTypeConfig[]>([]);
  const [campaignTypes, setCampaignTypes] = useState<CampaignTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? getCookie("auth-token") || localStorage.getItem("auth_token")
        : null;
    if (!token) return;

    Promise.all([
      getDispositions(activeOnly),
      getTicketTypes(activeOnly),
      getCampaignTypes(activeOnly),
    ])
      .then(([d, t, c]) => {
        setDispositions(d);
        setTicketTypes(t);
        setCampaignTypes(c);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeOnly]);

  const getOptionsForCampaignType = (campaignTypeValue: string) => {
    const type = campaignTypes.find((t) => t.value === campaignTypeValue);
    if (!type) return [];
    return activeOnly ? type.options.filter((o) => o.isActive) : type.options;
  };

  return {
    dispositions,
    ticketTypes,
    campaignTypes,
    loading,
    getOptionsForCampaignType,
    setDispositions,
    setTicketTypes,
    setCampaignTypes,
  };
}
