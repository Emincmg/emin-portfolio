import type { ModeFactory } from '../engine';

type Inst = { x: number; y: number; up: boolean; n: number; pulse: number };
type Pkt = { from: number; to: Inst | null; t: number; stage: 0 | 1 | 2 };

/** Edge map: 27 domains feed one gateway, which spreads traffic over three instances. */
export const edge: ModeFactory = (E) => {
  const { C, rgba, ctx } = E;
  let dots: { x: number; y: number; glow: number }[] = [], gw = { x: 0, y: 0 }, inst: Inst[] = [], pk: Pkt[] = [], acc = 0, rr = 0;
  const layout = () => {
    const cols = 9, gx = (E.W - 24) / (cols - 1);
    dots = Array.from({ length: 27 }, (_, i) => ({ x: 12 + (i % cols) * gx, y: 28 + Math.floor(i / cols) * 22, glow: dots[i]?.glow ?? 0 }));
    gw = { x: E.W / 2, y: E.H * .55 };
    // keep the same objects so packets in flight still count toward their instance
    if (!inst.length) inst = [0, 1, 2].map(() => ({ x: 0, y: 0, up: true, n: 0, pulse: 0 }));
    [.2, .5, .8].forEach((f, i) => { inst[i].x = E.W * f; inst[i].y = E.H * .86; });
  };
  const fire = (i: number) => { dots[i].glow = 1; pk.push({ from: i, to: null, t: 0, stage: 0 }); };
  return {
    label: 'Edge map', hint: 'tap an instance to take it down · tap a domain to send a burst',
    init() { dots = []; inst = []; layout(); pk = []; },
    resize: layout,
    click(x, y) {
      const hit = inst.find((s) => Math.hypot(s.x - x, s.y - y) < 34);
      if (hit) { hit.up = !hit.up; hit.pulse = 1; return; }
      let best = 0, bd = Infinity;
      dots.forEach((d, i) => { const dd = Math.hypot(d.x - x, d.y - y); if (dd < bd) { bd = dd; best = i; } });
      for (let k = 0; k < 8; k++) setTimeout(() => fire(best), k * 70);
    },
    frame(dt) {
      acc += dt * 6; while (acc > 1) { acc--; fire(Math.floor(Math.random() * dots.length)); }
      dots.forEach((d) => { d.glow = Math.max(0, d.glow - dt * 2); E.dot(d.x, d.y, 2.5 + d.glow * 2, rgba(d.glow > .1 ? C.warm : C.accent, .35 + d.glow * .6)); });
      E.text('27 domains', 0, 14, rgba(C.muted, .85), 10);
      inst.forEach((s) => { ctx.strokeStyle = rgba(s.up ? C.accent : C.bad, .25); ctx.beginPath(); ctx.moveTo(gw.x, gw.y); ctx.lineTo(s.x, s.y); ctx.stroke(); });
      const healthy = inst.filter((s) => s.up);
      pk = pk.filter((p) => {
        p.t += dt / (p.stage === 0 ? .6 : .35);
        const d = dots[p.from];
        if (p.stage === 0) {
          E.dot(E.lerp(d.x, gw.x, p.t), E.lerp(d.y, gw.y, p.t), 2.2, rgba(C.warm, .9));
          if (p.t >= 1) { if (!healthy.length) { p.stage = 2; p.t = 0; } else { p.to = healthy[rr++ % healthy.length]; p.stage = 1; p.t = 0; } }
          return true;
        }
        if (p.stage === 1 && p.to) {
          E.dot(E.lerp(gw.x, p.to.x, p.t), E.lerp(gw.y, p.to.y, p.t), 2.2, rgba(C.accent, .9));
          if (p.t >= 1) { p.to.n++; return false; }
          return true;
        }
        E.text('503', gw.x + 26, gw.y - p.t * 24, rgba(C.bad, 1 - p.t), 11);
        return p.t < 1;
      });
      E.dot(gw.x, gw.y, 16, rgba(C.accent, .95));
      E.text('gateway', gw.x, gw.y + 34, rgba(C.fg, .85), 11, 'center');
      inst.forEach((s, i) => {
        s.pulse = Math.max(0, s.pulse - dt);
        const col = s.up ? C.accent : C.bad;
        ctx.strokeStyle = rgba(col, .8); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(s.x, s.y, 16, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
        if (s.pulse > 0) { ctx.strokeStyle = rgba(col, s.pulse * .6); ctx.beginPath(); ctx.arc(s.x, s.y, 16 + (1 - s.pulse) * 18, 0, Math.PI * 2); ctx.stroke(); }
        E.text(s.up ? String(s.n) : '✕', s.x, s.y + 4, rgba(col, .95), 11, 'center');
        E.text(`app-${i + 1}`, s.x, s.y + 32, rgba(C.muted, .8), 10, 'center');
      });
    },
  };
};
