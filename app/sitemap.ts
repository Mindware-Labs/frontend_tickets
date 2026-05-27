import type { MetadataRoute } from "next";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const routes = [
  "",
  "/dashboard",
  "/calls",
  "/customers",
  "/campaigns",
  "/yards",
  "/landlords",
  "/phone-lines",
  "/users",
  "/reports",
  "/reports/campaigns",
  "/reports/landlords",
  "/reports/yards",
  "/agent-dashboard",
  "/profile",
  "/support",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "monthly" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
