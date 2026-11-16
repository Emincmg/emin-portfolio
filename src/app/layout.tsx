import type { Metadata, Viewport } from 'next';
import { Inter, Kode_Mono } from 'next/font/google';
import { site } from '@/content/site';
import './globals.css';

// Kode Mono for headings, labels, code and the terminal; Inter for running text
const sans = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-sans', display: 'swap' });
const mono = Kode_Mono({ subsets: ['latin', 'latin-ext'], variable: '--font-mono', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  keywords: site.keywords,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'profile',
    url: '/',
    siteName: site.name,
    title: site.title,
    description: site.description,
    locale: 'en_US',
    firstName: 'Ali Emin',
    lastName: 'Çomoğlu',
  },
  twitter: { card: 'summary_large_image', title: site.title, description: site.description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 } },
  category: 'technology',
};

export const viewport: Viewport = {
  themeColor: '#07060c',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
