import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/tools";

export default function robots(): MetadataRoute.Robots {
  // Only the production deployment (tools.codercops.com) should be crawlable.
  // The develop Worker builds with NEXT_PUBLIC_DEPLOY_ENV=develop, so it
  // returns a disallow-all robots.txt and never competes with production for SEO.
  if (process.env.NEXT_PUBLIC_DEPLOY_ENV && process.env.NEXT_PUBLIC_DEPLOY_ENV !== "production") {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
