import { site, hero, capabilities, projects } from '@/content/site';
import { Nav } from '@/components/sections/Nav';
import { Hero } from '@/components/sections/Hero';
import { Platform } from '@/components/sections/Platform';
import { Patterns } from '@/components/sections/Patterns';
import { Capabilities } from '@/components/sections/Capabilities';
import { Experience } from '@/components/sections/Experience';
import { Projects } from '@/components/sections/Projects';
import { OpenSource } from '@/components/sections/OpenSource';
import { Contact } from '@/components/sections/Contact';
import { Background } from '@/components/client/Background';
import { Terminal } from '@/components/client/Terminal';
import { Motion } from '@/components/client/Motion';

// Structured data: who this page is about, for search engines and AI answers.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  url: site.url,
  name: site.title,
  description: site.description,
  mainEntity: {
    '@type': 'Person',
    '@id': `${site.url}/#person`,
    name: site.name,
    url: site.url,
    email: `mailto:${site.email}`,
    jobTitle: site.jobTitle,
    description: hero.lead,
    worksFor: { '@type': 'Organization', name: site.employer },
    address: { '@type': 'PostalAddress', addressLocality: site.location.city, addressCountry: site.location.countryCode },
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Istanbul University' },
    knowsLanguage: ['tr', 'en'],
    knowsAbout: [...site.keywords.slice(3), ...capabilities.groups.map((g) => g.title), ...projects.items.map((p) => p.name)],
    sameAs: [site.github, site.linkedin],
  },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Background />
      <Terminal />
      <Nav />
      <main>
        <Hero />
        <Platform />
        <Patterns />
        <Capabilities />
        <Experience />
        <Projects />
        <OpenSource />
        <Contact />
      </main>
      <Motion />
    </>
  );
}
