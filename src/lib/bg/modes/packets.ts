import type { ModeFactory } from '../engine';

type Row = { no: number; t: string; src: string; dst: string; proto: string; len: number; info: string; stream: number };

const hosts = ['portal.example', 'crm.example', 'guide.example', 'agency.example', 'cms.example'];
const paths = ['/api/v1/insights', '/api/companies', '/api/invoices?page=2', '/media/hero.webp', '/api/rules/accept', '/sitemap.xml', '/healthz', '/api/deals'];
const rnd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** A packet capture: rows scroll by, the ones near the cursor become readable. */
export const packets: ModeFactory = (E) => {
  const { C, rgba } = E;
  let rows: Row[] = [], acc = 0, no = 1, follow: number | null = null, followUntil = 0, t0 = 0;
  const make = () => {
    const s = Math.floor(Math.random() * 40), cli = `198.51.100.${s + 10}`, port = 40000 + s * 37;
    const h = hosts[s % hosts.length], up = `172.18.${(s % 5) + 1}.${(s % 7) + 2}`;
    const kinds: [string, string, string, number, string][] = [
      [cli, '203.0.113.10', 'TCP', 74, `${port} → 443 [SYN] Seq=0 Win=64240 MSS=1460`],
      ['203.0.113.10', cli, 'TCP', 74, `443 → ${port} [SYN, ACK] Seq=0 Ack=1`],
      [cli, '203.0.113.10', 'TLSv1.3', 583, `Client Hello (SNI=${h})`],
      [cli, '203.0.113.10', 'HTTP2', 112, `HEADERS GET ${rnd(paths)}`],
      ['172.18.0.2', up, 'HTTP', 410, `GET ${rnd(paths)} HTTP/1.1 (proxy_pass)`],
      [up, '172.18.0.2', 'HTTP', 1514, 'HTTP/1.1 200 OK (application/json)'],
      ['203.0.113.10', cli, 'HTTP2', 96, Math.random() < 0.12 ? 'HEADERS 429 Too Many Requests' : 'HEADERS 200 OK, DATA'],
      [cli, '1.1.1.1', 'DNS', 78, `Standard query A ${h}`],
      ['1.1.1.1', cli, 'DNS', 94, `Standard query response A ${h} A 203.0.113.10`],
    ];
    const k = rnd(kinds);
    rows.push({ no: no++, t: ((performance.now() - t0) / 1000).toFixed(6), src: k[0], dst: k[1], proto: k[2], len: k[3], info: k[4], stream: s });
    if (rows.length > 80) rows.shift();
  };
  return {
    label: 'Network traffic', hint: 'hover to read · click to follow a stream',
    init() { rows = []; no = 1; t0 = performance.now(); for (let i = 0; i < 60; i++) make(); },
    click(_x, y) {
      const lh = 18, base = E.H - 24, idx = rows.length - 1 - Math.round((base - y) / lh);
      if (rows[idx]) { follow = rows[idx].stream; followUntil = performance.now() + 5000; }
    },
    frame(dt, now) {
      acc += dt * 7; while (acc > 1) { acc--; make(); }
      if (now > followUntil) follow = null;
      const lh = 18, base = E.H - 24, mo = E.mouse;
      const cols = E.W < 520 ? [12, 52, 999, 999, 130, 999, 190] : E.W < 760 ? [12, 52, 132, 999, 262, 999, 330] : [16, 70, 170, 330, 490, 570, 620];
      ['No.', 'Time', 'Source', 'Destination', 'Proto', 'Len', 'Info'].forEach((h, j) => { if (cols[j] < E.W - 40) E.text(h, cols[j], 18, rgba(C.muted, .85), 11); });
      for (let i = rows.length - 1, k = 0; i >= 0; i--, k++) {
        const y = base - k * lh; if (y < 40) break;
        const r = rows[i], near = Math.max(0, 1 - Math.abs(mo.y - y) / 140);
        const hit = follow !== null && r.stream === follow;
        const al = hit ? 0.95 : 0.3 + near * 0.65;
        const col = hit ? C.warm : r.info.includes('429') ? C.bad : r.proto === 'DNS' ? C.accent : C.fg;
        [String(r.no), r.t, r.src, r.dst, r.proto, String(r.len), r.info].forEach((s, j) => { if (cols[j] < E.W - 40) E.text(s, cols[j], y, rgba(col, al), 11); });
      }
    },
  };
};
