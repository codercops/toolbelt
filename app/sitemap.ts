import type { MetadataRoute } from "next";
import { SITE_URL, TOOLS } from "@/lib/tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    ...TOOLS.map((t) => ({
      url: `${SITE_URL}${t.path}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: t.sitemapPriority,
    })),
  ];
}
