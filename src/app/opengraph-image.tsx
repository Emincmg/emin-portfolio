import { ImageResponse } from 'next/og';
import { site, hero } from '@/content/site';

export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#07060c', color: '#ece9ff' }}>
        <div style={{ display: 'flex', fontSize: 24, letterSpacing: 4, color: '#00e5ff', textTransform: 'uppercase' }}>{hero.eyebrow}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 120, fontWeight: 800, lineHeight: 0.95, letterSpacing: -5 }}>{hero.first}</div>
          <div style={{ fontSize: 120, fontWeight: 800, lineHeight: 0.95, letterSpacing: -5, color: '#00e5ff' }}>{hero.last}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 28, color: '#bdb8da' }}>
          <div style={{ display: 'flex', maxWidth: 760 }}>Multi-tenant SaaS · event-driven systems · queues & concurrency · edge infrastructure</div>
          <div style={{ display: 'flex', color: '#ff2bd6' }}>{new URL(site.url).hostname}</div>
        </div>
      </div>
    ),
    size,
  );
}
