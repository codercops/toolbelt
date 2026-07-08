import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/tools";

export default function robots(): MetadataRoute.Robots {
  // Only the production deployment (tools.codercops.com) should be crawlable.
  // Preview and the develop staging domain set VERCEL_ENV to "preview", so they
  // return a disallow-all robots.txt and never compete with production for SEO.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
