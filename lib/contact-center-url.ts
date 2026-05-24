export type ContactCenterTab = "calls" | "tickets" | "manual-records";

export function buildContactCenterUrl(
  params: Record<string, string | number | null | undefined> & {
    tab?: ContactCenterTab;
  },
) {
  const search = new URLSearchParams();
  const { tab = "calls", ...rest } = params;

  if (tab) {
    search.set("tab", tab);
  }

  Object.entries(rest).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    search.set(key, String(value));
  });

  const query = search.toString();
  return query ? `/calls?${query}` : "/calls";
}
