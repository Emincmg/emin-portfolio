import type { MetadataRoute } from 'next';
import { site } from '@/content/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.shortName,
    description: site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#0d1116',
    theme_color: '#0d1116',
    icons: [{ src: '/icon', sizes: '64x64', type: 'image/png' }],
  };
}
