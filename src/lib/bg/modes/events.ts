import type { ModeFactory, RGB } from '../engine';

type Msg = { id: number; ev: string; part: number; st: 'outbox' | 'travel' | 'proc' | 'dlq'; t: number; tries: number; poison: boolean; x: number; y: number };
type Flash = { x: number; y: number; s: string; c: RGB; t: number };

const events = ['OrderPlaced', 'InvoiceIssued', 'DocumentUploaded', 'PaymentReceived', 'TenantCreated', 'ShipmentUpdated'];

/** Event streaming: outbox → partitions → consumers, with retries and a dead-letter queue. */
export const eventStream: ModeFactory = (E) => {
  const { C, rgba, ctx } = E;
  let msgs: Msg[] = [], acc = 0, id = 1000, dlq: Msg[] = [], acks = 0, flash: Flash[] = [];
  let G = { ox: 0, l0: 0, l1: 0, cx: 0, ww: 0, ly: [0, 0, 0], dx: 0, dy: 0, hy: 14 };
  const layout = () => {
    const n = E.W < 600;
    G = n ? { ox: E.W * .04, l0: E.W * .3, l1: E.W * .7, cx: E.W * .74, ww: E.W * .24, ly: [.3, .48, .66].map((f) => E.H * f), dx: E.W * .5, dy: E.H * .88, hy: 14 }
      : { ox: E.W * .02, l0: E.W * .2, l1: E.W * .72, cx: E.W * .76, ww: 86, ly: [.34, .56, .78].map((f) => E.H * f), dx: E.W * .93, dy: E.H * .56, hy: 14 };
  };
  const spawn = () => msgs.push({ id: id++, ev: events[Math.floor(Math.random() * events.length)], part: Math.floor(Math.random() * 3), st: 'outbox', t: 0, tries: 0, poison: Math.random() < 0.04, x: 0, y: 0 });
  return {
    label: 'Event streaming', hint: 'click a message to poison it · click the DLQ to replay',
    init() { layout(); msgs = []; dlq = []; acks = 0; for (let i = 0; i < 6; i++) spawn(); },
    resize: layout,
    click(x, y) {
      if (Math.hypot(x - G.dx, y - G.dy) < 60 && dlq.length) { dlq.forEach((m) => { m.st = 'outbox'; m.t = 0; m.tries = 0; m.poison = false; msgs.push(m); }); dlq = []; return; }
      let best: Msg | null = null, bd = 40;
      msgs.forEach((m) => { const d = Math.hypot(m.x - x, m.y - y); if (d < bd) { bd = d; best = m; } });
      if (best) (best as Msg).poison = true;
    },
    frame(dt) {
      acc += dt * 2.6; while (acc > 1) { acc--; spawn(); }
      E.text('outbox', G.ox, G.hy, rgba(C.muted, .8), 11);
      E.text('topic: domain-events', G.l0, G.hy, rgba(C.muted, .8), 11);
      E.text('consumers', G.cx, G.hy, rgba(C.muted, .8), 11);
      G.ly.forEach((y, i) => {
        ctx.strokeStyle = rgba(C.accent, .18); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(G.l0, y); ctx.lineTo(G.l1, y); ctx.stroke();
        E.text(`p${i}`, G.l0 - 8, y + 4, rgba(C.muted, .6), 10, 'right');
        ctx.strokeStyle = rgba(C.accent, .5); ctx.strokeRect(G.cx, y - 11, G.ww, 22);
        E.text(`worker-${i + 1}`, G.cx + G.ww / 2, y + 4, rgba(C.fg, .8), 10, 'center');
      });
      ctx.strokeStyle = rgba(C.bad, .5); ctx.strokeRect(G.dx - 50, G.dy - 22, 100, 44);
      E.text(`DLQ · ${dlq.length}`, G.dx, G.dy - 2, rgba(dlq.length ? C.bad : C.muted, .9), 12, 'center');
      E.text(dlq.length ? 'click to replay' : 'empty', G.dx, G.dy + 14, rgba(C.muted, .7), 10, 'center');
      msgs.filter((m) => m.st === 'outbox').slice(-3).forEach((m, i) => E.text(`#${m.id} ${m.ev}`, G.ox, G.ly[0] + i * 16, rgba(C.fg, .45 + i * .2), 10));
      msgs = msgs.filter((m) => {
        m.t += dt;
        const y = G.ly[m.part];
        if (m.st === 'outbox') { m.x = G.ox + 40; m.y = G.ly[0]; if (m.t > 0.6) { m.st = 'travel'; m.t = 0; } return true; }
        if (m.st === 'travel') {
          const f = Math.min(1, m.t / 1.8); m.x = E.lerp(G.l0, G.l1, f); m.y = y;
          ctx.fillStyle = rgba(m.poison ? C.bad : C.accent, .85); ctx.fillRect(m.x - 9, y - 5, 18, 10);
          if (f > .05 && f < .9) E.text(m.ev, m.x, y - 10, rgba(C.fg, .55), 9, 'center');
          if (f >= 1) { m.st = 'proc'; m.t = 0; }
          return true;
        }
        if (m.st === 'proc') {
          m.x = G.cx + G.ww / 2; m.y = y;
          if (m.t > .35) {
            if (m.poison || Math.random() < .03) {
              m.tries++;
              if (m.tries >= 3) { m.st = 'dlq'; m.t = 0; flash.push({ x: G.cx, y, s: `#${m.id} → DLQ`, c: C.bad, t: 0 }); return true; }
              flash.push({ x: G.cx, y, s: `retry ${m.tries}/3`, c: C.warm, t: 0 }); m.st = 'travel'; m.t = 1.1; return true;
            }
            acks++; flash.push({ x: G.cx + G.ww + 6, y: y + 4, s: '✓ ack', c: C.accent, t: 0 }); return false;
          }
          return true;
        }
        const f = Math.min(1, m.t / .8);
        ctx.fillStyle = rgba(C.bad, .9); ctx.fillRect(E.lerp(G.cx + G.ww / 2, G.dx, f) - 9, E.lerp(y, G.dy, f) - 5, 18, 10);
        if (f >= 1) { dlq.push(m); return false; }
        return true;
      });
      flash = flash.filter((f) => { f.t += dt; E.text(f.s, f.x, f.y - 18 - f.t * 12, rgba(f.c, Math.max(0, 1 - f.t)), 10); return f.t < 1; });
      E.text(`acked ${acks} · at-least-once`, G.l1, G.hy, rgba(C.muted, .8), 11, 'right');
    },
  };
};
