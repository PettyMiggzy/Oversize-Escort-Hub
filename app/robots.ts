import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/dashboard-e", "/dashboard-c", "/dashboard-b"],
      },
    ],
    sitemap: "https://www.oversize-escort-hub.com/sitemap.xml",
  };
}
