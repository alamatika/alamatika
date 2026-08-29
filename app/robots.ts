import type { MetadataRoute } from "next";

const baseUrl = "https://alamatika.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/creator/",
        "/api/",
        "/wallet/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}