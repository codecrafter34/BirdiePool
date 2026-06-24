import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  // In a real app, we would fetch dynamic routes (e.g., featured charities) here
  return [
    {
      url: process.env.NEXT_PUBLIC_APP_URL || 'https://birdiepool.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://birdiepool.com'}/charities`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];
}
