import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Authenticated dashboard routes are additionally marked noindex
        // via metadata in the dashboard layout.
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
