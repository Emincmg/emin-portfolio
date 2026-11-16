// All copy on the site lives here. Update the CV by editing this file only.

// Public address of the site. Set NEXT_PUBLIC_SITE_URL once you own a domain; on Vercel the
// project's production *.vercel.app address is used automatically until then.
const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
).replace(/\/$/, '');

export const site = {
  url: siteUrl,
  name: 'Ali Emin Çomoğlu',
  shortName: 'AEÇ',
  jobTitle: 'Software Engineer',
  employer: 'Blue Palm Operational',
  location: { city: 'Istanbul', country: 'Türkiye', countryCode: 'TR' },
  email: 'emin.comoglu96@gmail.com',
  copyrightYear: 2026,
  github: 'https://github.com/Emincmg',
  linkedin: 'https://www.linkedin.com/in/emin-%C3%A7omo%C4%9Flu-657213237/',
  title: 'Ali Emin Çomoğlu — Software Engineer',
  description:
    'Software engineer in Istanbul, leading a web team and designing multi-tenant SaaS, event-driven backends, queues and concurrent systems, and the edge infrastructure that runs them. Laravel, NestJS, .NET and Rust.',
  keywords: [
    'Ali Emin Çomoğlu', 'Software Engineer', 'Lead Developer', 'Software Architect', 'Systems Architecture', 'Multi-tenant SaaS', 'Event-driven architecture',
    'CQRS', 'Onion Architecture', 'Laravel', 'NestJS', '.NET', 'Rust', 'Distributed systems', 'Istanbul', 'Backend engineer'
  ],
};

export const hero = {
  eyebrow: 'Software Engineer · Istanbul',
  first: 'Ali Emin',
  last: 'Çomoğlu',
  roles: [
    'Systems architect · Laravel · NestJS · .NET · Rust',
    'Onion architecture · CQRS · event-driven design',
    'Queues · concurrency · multi-tenant systems',
    'Edge infrastructure · traffic management · network architecture',
    'Lead developer · Scrum · 5-person team',
  ],
  lead: 'I design the systems a company runs on: one platform, eight product families, and a team that ships them.',
  stats: [
    { value: '8', label: 'product families architected' },
    { value: '27', label: 'domains behind one gateway' },
    { value: '5', label: 'engineers led with Scrum' },
  ],
};

export const platform = {
  eyebrow: '01 — The platform',
  title: 'Every product, one edge.',
  body: 'All company products run on a platform I built. I own the edge: DNS for every domain and a single gateway that serves 27 domains with encryption, traffic management and API protection. Each product lives in its own isolated network, so any of them can ship without touching the rest.',
  products: [
    ['Investment platform', 'core · messaging'], ['B2B CRM', 'scaled replicas'], ['CRM analytics', 'time-series'], ['Pricing engine', 'rules + LLM'],
    ['Booking platform', 'event-driven payments'], ['Property mgmt', 'channel sync'], ['Guest guide', 'QR app'], ['Agency site', 'site + portal'],
    ['Internal ERP', 'deals · orders'], ['Headless CMS', 'db per tenant'], ['Scheduling API', 'LLM tool'], ['Consulting site', 'site + CMS'], ['Staff portal', 'notifications'],
  ] as [string, string][],
  infra: [
    { k: 'DNS & edge security', body: 'DNS and edge configuration for every company domain: records, proxying, origin certificates and an end-to-end encrypted chain to the origin.' },
    { k: 'Gateway & reverse proxy', body: 'A single gateway for 27 domains handling TLS termination, routing, security headers and content security policy, rate limiting and access control for non-production environments.' },
    { k: 'Traffic management & availability', body: 'Traffic distributed across horizontally scaled instances, health checks, zero-downtime image-based releases and uptime monitoring.' },
    { k: 'Network architecture', body: 'Network segmentation with an isolated network per product, internal-only services that are never exposed publicly, and a solid grounding in TCP/IP, DNS, HTTP(S) and TLS.' },
  ],
};

export const patterns = {
  eyebrow: '02 — How I structure code',
  title: 'Patterns I build with.',
  items: [
    { rings: 'web infra app domain', title: 'Onion / Clean Architecture', body: 'Domain, Application, Infrastructure and Web layers with every dependency pointing inward. It is the base template every .NET API project starts from.' },
    { rings: 'app', title: 'CQRS + Mediator', body: 'Commands and queries are separate models, dispatched through a mediator. Used in the API template and the multi-tenant headless CMS.' },
    { rings: 'domain app', title: 'Event-driven & Observer', body: 'Domain events with listeners drive the payment lifecycle. In the CRM, an event bus with a transactional outbox and a dead-letter queue.' },
    { rings: 'domain', title: 'Strategy', body: 'Interchangeable rule sets picked at runtime, such as business rules that change by year in the investment platform.' },
    { rings: 'infra app', title: 'Repository & Service Layer', body: 'Data access sits behind repositories; business logic lives in services behind interfaces, so infrastructure can change without touching the domain.' },
    { rings: 'web infra', title: 'Adapter & Multi-tenancy', body: 'Adapters at the edge of the application resolve the tenant from the request domain, verify a domain-bound key and open a tenant context; every tenant gets its own database.' },
    { rings: 'web', title: 'Facade & DTO', body: 'Facades over services and payment providers; per-domain DTOs carry data between layers.' },
  ],
  also: 'Also: modular monolith · database-per-tenant isolation · backend-for-frontend · Domain-Driven Design · SOLID',
};

export const capabilities = {
  eyebrow: '03 — Capabilities',
  title: 'Beyond the request–response.',
  groups: [
    { title: 'Asynchronous processing & queues', items: ['Worker queues for heavy and scheduled jobs (BullMQ, Laravel queues)', 'Transactional outbox, retries and dead-letter queues', 'Event buses and stream-fed consumers (Redis streams)', 'At-least-once delivery with failure isolation'] },
    { title: 'Concurrency & parallelism', items: ['Multi-threaded async runtimes in Rust (Tokio) with lock-free concurrent maps', 'Async/await and hosted background services in .NET', 'Long-lived application workers (Octane, FrankenPHP) with per-request state isolation', 'Parallel I/O and request-scoped async context propagation'] },
    { title: 'Distributed & multi-tenant systems', items: ['Database-per-tenant isolation with domain-based tenant resolution', 'Modular monoliths with clear module boundaries and events', 'Horizontally scaled services behind one gateway', 'Separate analytics pipelines on time-series storage'] },
    { title: 'Real-time systems', items: ['WebSocket gateways for notifications and progress', 'Broadcasting with presence and read receipts', 'Webhook-driven re-evaluation with cooldowns'] },
    { title: 'Security engineering', items: ['Proof-of-possession tokens (DPoP), refresh-token rotation with family revocation', 'Domain-bound HMAC API keys, hashed storage, constant-time checks', 'Content security policy, rate limiting, least-exposure networks', 'Privacy by design: hashed IPs, minimal personal data'] },
    { title: 'AI systems', items: ['Tool-using LLM agents with human approval gates', 'Tiered model routing and cost metering', 'Services that publish their own API definitions as agent tools'] },
  ],
};

export type Commit =
  | { lane: 0 | 1; hash: string; msg: string; ref?: { kind: 'head' | 'tag'; text: string } }
  | { lane: 0; hash: string; msg: string; ref: { kind: 'tag'; text: string }; role: { title: string; org: string; when: string; body: string } };

export const experience = {
  eyebrow: '04 — Experience',
  title: 'git log --graph career',
  commits: [
    { lane: 0, hash: 'a1f9e3c', msg: 'present', ref: { kind: 'head', text: 'HEAD → main' } },
    { lane: 1, hash: '7c2d0b4', msg: 'feat: shared platform, 27 domains behind one gateway' },
    { lane: 1, hash: 'e5a91f2', msg: 'feat: Scrum for the 5-person team' },
    { lane: 1, hash: '3d8c6a0', msg: 'feat: architecture for 8 product families' },
    { lane: 0, hash: '4e7b2d1', msg: 'merge: promote to Lead Developer', ref: { kind: 'tag', text: 'tag: v3' },
      role: { title: 'Lead Developer', org: 'Blue Palm Operational', when: 'Mar 2025 — present · Kadıköy, Istanbul',
        body: "Lead the 5-person web development team and own all web development decisions and technical strategy. Run the team's Scrum process. Designed the architecture of 8 product families and built the core systems; set the quality bar with PR checks, architecture docs and migrations validated by comparison tests." } },
    { lane: 1, hash: 'b2f0c77', msg: 'feat: Onion + CQRS / Mediator template for every API' },
    { lane: 1, hash: '61de9a3', msg: 'refactor: investment portal, booking platform and PMS' },
    { lane: 0, hash: '9c0d5a2', msg: 'merge: join Blue Palm as Back-end Developer', ref: { kind: 'tag', text: 'tag: v2' },
      role: { title: 'Back-end Developer', org: 'Blue Palm Operational', when: 'Oct 2023 — Mar 2025',
        body: 'Built backend applications in C# / .NET Core on OOP and SOLID and created the Onion (Clean) Architecture + CQRS / Mediator template every API project starts from. Grew and restructured the investment portal, a hotel booking platform and the property management system.' } },
    { lane: 1, hash: 'd4e8b19', msg: 'feat: custom Laravel apps for clients' },
    { lane: 0, hash: '2b8e6f0', msg: 'init: Freelance Software Developer', ref: { kind: 'tag', text: 'tag: v1' },
      role: { title: 'Freelance Software Developer', org: 'Independent · Remote', when: 'Aug 2022 — Oct 2023',
        body: 'Developed, maintained and improved custom Laravel web applications for clients.' } },
  ] as Commit[],
};

export type Project = { tag: string; name: string; product: string; points: string[]; diagram: string; caption: string };

export const projects = {
  eyebrow: '05 — Projects & architecture',
  title: "What I built, and how it's put together.",
  items: [
    { tag: 'Real estate investment · 5 services', name: 'Investment Platform', diagram: 'invest', caption: '5 services · shared auth · queued syncs',
      product: 'Shareholder management, share swaps, loyalty programs, a marketplace, citizenship applications and messaging for an investor community.',
      points: ['Layered core: service layer behind interfaces, per-domain DTOs, Strategy pattern for year-dependent rules, queued synchronisation jobs.',
        'Runs on long-lived application workers; per-request state isolation verified under 320 concurrent requests during the move to server-side rendering.',
        'Separate messaging service on shared authentication that reads legacy messages as an archive, so the switch needed no data migration.'] },
    { tag: 'SaaS · multi-tenant', name: 'Multi-Tenant Headless CMS', diagram: 'cms', caption: 'domain → tenant → own database',
      product: 'One content platform serving many client websites, each isolated in its own database, managed from a single admin panel.',
      points: ['Tenant adapters resolve every request from its domain: a registry with positive and negative caching finds the tenant while a domain-bound API key is verified in parallel.',
        'Keys carry an HMAC tag of their domain, so a key only works on the site it was issued for; only hashes are stored and comparisons are constant-time.',
        'The tenant context lives in async-local storage and travels with every command, query and event; each tenant gets its own database.',
        'The admin panel switches into a target tenant under a role policy (admin, editor, viewer), with per-tenant rate limits and refresh-token rotation with family revocation.'] },
    { tag: 'B2B SaaS · multi-tenant', name: 'Multi-Tenant B2B CRM', diagram: 'crm', caption: 'modular monolith · outbox · workers · DLQ',
      product: 'Company formation, shipments, documents, invoicing, payments and office services for companies expanding abroad.',
      points: ['Tenant-aware modular monolith of ~15 domain modules communicating over an event bus.',
        'Transactional outbox so no event is lost; background worker queues for heavy jobs such as bulk document processing; dead-letter queue to isolate failures.',
        'Proof-of-possession authentication, real-time progress channels, a horizontally scaled frontend and a separate stream-fed time-series analytics service documented in 8 ADRs.'] },
    { tag: 'Revenue management · LLM', name: 'Dynamic Pricing Engine', diagram: 'pricing', caption: 'shadow mode · guard · human in the loop',
      product: 'Automated pricing for short-term rentals: proposes prices against occupancy targets and publishes them to distribution channels once approved.',
      points: ['Rules run in shadow mode first and go live only after passing a scorecard threshold.',
        'Every live change is guarded, reversible and stamped with the configuration version that produced it; webhook-triggered re-evaluation with cooldowns.',
        'LLM agent with read-only tools and a single "propose" tool, tiered model routing and cost metering; a human approves, proposals expire.'] },
    { tag: 'Hospitality', name: 'Booking & Property Management', diagram: 'hospitality', caption: 'observers · one payment interface · background services',
      product: 'A hotel and dormitory booking platform, a property management system synced from distribution channels, and smart-lock monitoring.',
      points: ['Payment lifecycle driven by domain events and observers; commissions and currency conversion as separate services.',
        'Several payment providers behind one service interface.',
        'Asynchronous background services watch lock connectivity and battery and alert by email and messaging.'] },
    { tag: 'Guest experience', name: 'QR Guest Guide', diagram: 'guide', caption: 'route → service → repository',
      product: 'A digital guest guide: scan the code in the apartment, accept the house rules, get the Wi-Fi password.',
      points: ['Layered backend with API types as a single source of truth shared with the frontend.',
        'Printed QR codes made immutable at the database level; hourly synchronisation from distribution channels.',
        'Versioned rule acceptances; IP addresses stored only as hashes.'] },
    { tag: 'Agency · ERP', name: 'Agency Platform & ERP', diagram: 'agency', caption: 'ERP as the hub',
      product: 'A video production agency site with a customer portal, backed by an internal CRM/ERP and a video processing pipeline.',
      points: ['The site’s server layer calls the ERP for payments, orders and files; leads land as deals with first- and last-touch attribution.',
        'A watcher service transcodes uploaded video into adaptive streams and publishes them to object storage.'] },
    { tag: 'Scheduling · LLM tool', name: 'Scheduling Service', diagram: 'calendar', caption: 'LLM tool · async runtime · BFF',
      product: 'Connects a chatbot to calendars and video meetings, with a self-service booking page.',
      points: ['Asynchronous service on a multi-threaded runtime with a lock-free concurrent cache.',
        'Publishes its own API definition so LLMs can call it as a tool; backend-for-frontend keeps the server-to-server key out of the browser.'] },
  ] as Project[],
  also: "Also architected: a consulting firm's website and publications CMS, an internal staff portal with pluggable notification channels, and several corporate websites.",
};

export const openSource = {
  eyebrow: '06 — Open source & background',
  title: 'Things I put out there.',
  repos: [
    { name: 'arcmin', meta: 'Rust · egui · v1.1.0', url: 'https://github.com/Emincmg/arcmin', body: 'A desktop editor and player for branching interactive stories, compatible with Arcweave exports.' },
    { name: 'convo-lite', meta: 'Laravel · Packagist', url: 'https://github.com/Emincmg/convo-lite', body: "A lightweight chat package for Laravel: conversations, read receipts and broadcasting. Runs the company's internal chat." },
  ],
  education: { school: 'Istanbul University', degree: 'Computer Programming (Associate Degree)', when: '2022 — present' },
  languages: ['Turkish — native', 'English — B2'],
};

export const contact = {
  eyebrow: '07 — Contact',
  headline: "Let's build something solid.",
};
