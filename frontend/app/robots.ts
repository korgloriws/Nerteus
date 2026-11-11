import type { MetadataRoute } from "next";
import { getPublicSiteUrl } from "../lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getPublicSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/posts/*/cover", "/api/media/*"],
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
