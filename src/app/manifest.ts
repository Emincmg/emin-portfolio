import type { MetadataRoute } from 'next';
import { site } from '@/content/site';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.shortName,
    description: site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#07060c',
    theme_color: '#07060c',
    icons: [{ src: '/icon', sizes: '64x64', type: 'image/png' }],
  };
}
