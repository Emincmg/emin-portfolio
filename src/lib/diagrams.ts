// Architecture drawings as data. Rendered as SVG on the server, animated on the client.

export type DNode = { id: string; x: number; y: number; label: string; sub?: string; style?: 'hl' | 'warm' };
export type DEdge = { from: string; to: string; dashed?: boolean };
export type Diagram = { nodes: DNode[]; edges: DEdge[] };

export const NODE_W = 110;
export const NODE_H = 42;

const n = (id: string, x: number, y: number, label: string, sub = '', style?: DNode['style']): DNode => ({ id, x, y, label, sub, style });
const e = (from: string, to: string, dashed = false): DEdge => ({ from, to, dashed });

export const DIAGRAMS: Record<string, Diagram> = {
  invest: {
    nodes: [n('web', 10, 20, 'SSR frontend', 'per-request context'), n('mob', 10, 140, 'Mobile app', 'REST v1'), n('api', 160, 80, 'Core API', 'long-lived workers', 'hl'),
      n('chat', 160, 200, 'Messaging', 'own service'), n('auth', 310, 200, 'Shared auth', 'tokens'), n('q', 310, 20, 'Queue workers', 'bank · sheet sync', 'warm'),
      n('cache', 310, 110, 'Cache', 'targeted updates'), n('db', 160, 290, 'Database', 'archive + active')],
    edges: [e('web', 'api'), e('mob', 'api'), e('mob', 'chat'), e('api', 'q'), e('api', 'cache'), e('chat', 'auth'), e('api', 'auth', true), e('chat', 'db'), e('api', 'db')],
  },
  cms: {
    nodes: [n('site', 10, 10, 'Tenant site', 'domain + API key'), n('ad', 160, 10, 'Tenant adapter', 'domain → tenant', 'hl'), n('key', 310, 10, 'Key check', 'HMAC domain tag', 'warm'),
      n('reg', 310, 80, 'Tenant registry', 'cache 60s / 10s'), n('panel', 10, 150, 'Admin panel', 'target tenant'), n('ctx', 160, 150, 'Tenant context', 'async-local', 'hl'),
      n('pol', 10, 240, 'Access policy', 'admin·editor·viewer'), n('cq', 160, 240, 'CQRS handlers', 'commands · queries'), n('d1', 310, 200, 'DB · tenant A'), n('d2', 310, 270, 'DB · tenant B')],
    edges: [e('site', 'ad'), e('ad', 'key'), e('ad', 'reg'), e('ad', 'ctx'), e('panel', 'ctx'), e('panel', 'pol', true), e('ctx', 'cq'), e('cq', 'd1'), e('cq', 'd2')],
  },
  crm: {
    nodes: [n('m1', 10, 20, 'Tenants', 'module'), n('m2', 130, 20, 'Invoices', 'module'), n('m3', 250, 20, 'Documents', 'module'), n('bus', 130, 120, 'Event bus', 'domain events', 'hl'),
      n('out', 10, 220, 'Outbox', 'transactional'), n('wk', 130, 220, 'Worker queue', 'bulk jobs', 'hl'), n('dlq', 250, 290, 'Dead letters', 'isolated', 'warm'),
      n('rt', 250, 220, 'Realtime', 'progress · notify'), n('ana', 250, 120, 'Analytics', 'stream → time-series')],
    edges: [e('m1', 'bus'), e('m2', 'bus'), e('m3', 'bus'), e('bus', 'out'), e('bus', 'wk'), e('wk', 'rt'), e('wk', 'dlq', true), e('m3', 'ana', true)],
  },
  pricing: {
    nodes: [n('hook', 10, 20, 'Booking webhook', 'cooldown'), n('eng', 160, 20, 'Rule engine', 'occupancy · pace', 'hl'), n('sh', 310, 20, 'Shadow mode', 'scorecard gate'),
      n('llm', 10, 150, 'LLM agent', 'read-only tools', 'warm'), n('prop', 160, 150, 'Proposal', 'expires (TTL)'), n('hum', 310, 150, 'Human approval', 'role chain'),
      n('grd', 160, 270, 'Execution guard', 'undo · config ver.', 'hl'), n('cm', 310, 270, 'Distribution', 'price publish')],
    edges: [e('hook', 'eng'), e('eng', 'sh'), e('sh', 'grd', true), e('llm', 'prop'), e('prop', 'hum'), e('hum', 'grd'), e('eng', 'grd'), e('grd', 'cm')],
  },
  hospitality: {
    nodes: [n('bk', 10, 20, 'Booking', 'platform'), n('ev', 160, 20, 'Payment events', 'started · received · failed', 'hl'), n('o1', 310, 0, 'Observer', 'commissions'),
      n('o2', 310, 70, 'Observer', 'currency'), n('pms', 10, 170, 'PMS', 'channel sync'), n('svc', 160, 170, 'Payment service', 'one interface', 'hl'),
      n('p1', 310, 140, 'Provider A'), n('p2', 310, 200, 'Provider B'), n('p3', 310, 260, 'Provider C'), n('lock', 10, 280, 'Lock monitor', 'async service', 'warm'), n('al', 160, 280, 'Alerts', 'email · messaging')],
    edges: [e('bk', 'ev'), e('ev', 'o1'), e('ev', 'o2'), e('pms', 'svc'), e('svc', 'p1'), e('svc', 'p2'), e('svc', 'p3'), e('lock', 'al')],
  },
  guide: {
    nodes: [n('qr', 10, 20, 'QR code', 'immutable'), n('spa', 160, 20, 'Guest app', 'same origin'), n('rt', 310, 20, 'Routes', 'contract types', 'hl'), n('sv', 310, 120, 'Services', 'versioned rules'),
      n('rp', 310, 220, 'Repositories', 'queries'), n('db', 160, 220, 'Database', 'IPs hashed'), n('sync', 10, 220, 'Channel sync', 'hourly', 'warm')],
    edges: [e('qr', 'spa'), e('spa', 'rt'), e('rt', 'sv'), e('sv', 'rp'), e('rp', 'db'), e('sync', 'db')],
  },
  agency: {
    nodes: [n('site', 10, 40, 'Agency site', 'server routes'), n('bot', 10, 170, 'Chatbot'), n('erp', 160, 100, 'ERP API', 'deals · orders', 'hl'), n('pay', 310, 20, 'Payments', 'webhooks'),
      n('files', 310, 110, 'Object storage', 'customer files'), n('tx', 160, 240, 'Transcoder', 'watcher service', 'warm'), n('hls', 310, 240, 'Adaptive streams', 'published')],
    edges: [e('site', 'erp'), e('bot', 'erp'), e('erp', 'pay'), e('erp', 'files'), e('tx', 'hls'), e('hls', 'files', true)],
  },
  calendar: {
    nodes: [n('llm', 10, 30, 'LLM / chatbot', 'tool call'), n('spec', 160, 30, 'API definition', 'published', 'warm'), n('api', 310, 100, 'Scheduling API', 'async runtime', 'hl'),
      n('g', 310, 220, 'Calendar provider', 'video links'), n('ui', 10, 170, 'Booking page', 'browser'), n('bff', 160, 170, 'BFF', 'holds the key', 'hl')],
    edges: [e('llm', 'spec'), e('spec', 'api'), e('ui', 'bff'), e('bff', 'api'), e('api', 'g')],
  },
};

/** Bezier from the facing sides of two boxes. */
export function edgePath(a: DNode, b: DNode): string {
  const ax = a.x + NODE_W / 2, ay = a.y + NODE_H / 2, bx = b.x + NODE_W / 2, by = b.y + NODE_H / 2;
  const horiz = Math.abs(bx - ax) > Math.abs(by - ay);
  const sx = horiz ? a.x + (bx > ax ? NODE_W : 0) : ax, sy = horiz ? ay : a.y + (by > ay ? NODE_H : 0);
  const tx = horiz ? b.x + (bx > ax ? 0 : NODE_W) : bx, ty = horiz ? by : b.y + (by > ay ? 0 : NODE_H);
  return horiz
    ? `M${sx} ${sy} C${(sx + tx) / 2} ${sy} ${(sx + tx) / 2} ${ty} ${tx} ${ty}`
    : `M${sx} ${sy} C${sx} ${(sy + ty) / 2} ${tx} ${(sy + ty) / 2} ${tx} ${ty}`;
}

/** The platform diagram: CI → registry → server, DNS → gateway → products. */
export const PLATFORM = { hubX: 330, hubY: 300, hubW: 190, hubH: 76 };
export function productPosition(i: number) {
  const col = i < 7 ? 0 : 1, row = col ? i - 7 : i;
  return { x: [640, 820][col], y: 130 + row * 58 + (col ? 29 : 0) };
}
