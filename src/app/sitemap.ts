import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/play`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/wall`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/login`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/register`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
