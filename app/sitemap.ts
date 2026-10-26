import { MetadataRoute } from "next";
import { STATIC_STATE_CODES } from "@/lib/state-codes";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.oversize-escort-hub.com",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://www.oversize-escort-hub.com/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.oversize-escort-hub.com/privacy",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.oversize-escort-hub.com/terms",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://www.oversize-escort-hub.com/pilot-car-guide",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    ...STATIC_STATE_CODES.map((code) => ({
      url: `https://www.oversize-escort-hub.com/pilot-car-escorts/${code.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
