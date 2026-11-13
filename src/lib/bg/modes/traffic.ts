import type { ModeFactory } from '../engine';

type Instance = { up: boolean; n: number; name: string; pulse: number; x: number; y: number };
type Packet = { sx: number; sy: number; t: number; stage: 0 | 1 | 2; rep: Instance | null };

/** Traffic management: the cursor sends requests through a gateway to instances; take one down and traffic shifts. */
export const traffic: ModeFactory = (E) => {
  const { C, rgba, ctx } = E;
  let gw = { x: 0, y: 0 }, reps: Instance[] = [], pk: Packet[] = [], rr = 0, acc = 0, nextCheck = 0;
  const layout = () => {
    const narrow = E.W < 760, ys = [0.28, 0.5, 0.72];
    gw = narrow ? { x: E.W * .5, y: E.H * .42 } : { x: E.W * .66, y: E.H * .5 };
    if (!reps.length) reps = ys.map((_, i) => ({ up: true, n: 0, name: `app-${i + 1}`, pulse: 0, x: 0, y: 0 }));
    reps.forEach((r, i) => Object.assign(r, narrow ? { x: E.W * (0.2 + i * 0.3), y: E.H * .75 } : { x: E.W * .88, y: E.H * ys[i] }));
  };
  return {
    label: 'Traffic management', hint: 'move to send traffic · click an instance to take it down',
    init() { reps = []; layout(); pk = []; },
    resize: layout,
    click(x, y) { const r = reps.find((r) => Math.hypot(r.x - x, r.y - y) < 46); if (r) { r.up = !r.up; r.pulse = 1; } },
    frame(dt, now) {
      const mo = E.mouse;
      const fromCursor = now - mo.last < 1500 && mo.x > -40 && mo.y > -40 && mo.x < E.W + 40 && mo.y < E.H + 40;
      acc += dt * (fromCursor ? 9 : 4);
      while (acc > 1) { acc--; pk.push({ sx: fromCursor ? mo.x : 0, sy: fromCursor ? mo.y : E.H * (0.1 + Math.random() * 0.5), t: 0, stage: 0, rep: null }); }
      if (now > nextCheck) { reps.forEach((r) => (r.pulse = 1)); nextCheck = now + 2000; }
      E.text('upstream app {', gw.x - 70, gw.y - 70, rgba(C.muted, 0.7), 11);
      reps.forEach((r, i) => E.text(`  server ${r.name}${r.up ? '' : ' down'};`, gw.x - 70, gw.y - 54 + i * 15, rgba(r.up ? C.muted : C.bad, 0.7), 11));
      E.text('}', gw.x - 70, gw.y - 54 + reps.length * 15, rgba(C.muted, 0.7), 11);
      reps.forEach((r) => { ctx.strokeStyle = rgba(r.up ? C.accent : C.bad, 0.25); ctx.beginPath(); ctx.moveTo(gw.x, gw.y); ctx.lineTo(r.x, r.y); ctx.stroke(); });
      const healthy = reps.filter((r) => r.up);
      pk = pk.filter((p) => {
        p.t += dt / (p.stage === 0 ? 0.7 : 0.35);
        if (p.stage === 0) {
          E.dot(E.lerp(p.sx, gw.x, p.t), E.lerp(p.sy, gw.y, p.t), 2.6, rgba(C.accent, 0.85));
          if (p.t >= 1) {
            if (!healthy.length) { p.stage = 2; p.t = 0; return true; }
            p.rep = healthy[rr++ % healthy.length]; p.stage = 1; p.t = 0;
          }
          return true;
        }
        if (p.stage === 1 && p.rep) {
          E.dot(E.lerp(gw.x, p.rep.x, p.t), E.lerp(gw.y, p.rep.y, p.t), 2.6, rgba(C.warm, 0.9));
          if (p.t >= 1) { p.rep.n++; return false; }
          return true;
        }
        E.text('503', gw.x + 18, gw.y - 14 - p.t * 30, rgba(C.bad, 1 - p.t), 12);
        return p.t < 1;
      });
      E.dot(gw.x, gw.y, 12, rgba(C.accent, 0.95));
      E.text('gateway · round-robin', gw.x, gw.y + 32, rgba(C.fg, 0.8), 11, 'center');
      reps.forEach((r) => {
        r.pulse = Math.max(0, r.pulse - dt * 1.2);
        const col = r.up ? C.accent : C.bad;
        ctx.fillStyle = rgba(C.fg, 0.04); ctx.strokeStyle = rgba(col, 0.7);
        ctx.beginPath(); ctx.roundRect(r.x - 40, r.y - 18, 80, 36, 6); ctx.fill(); ctx.stroke();
        if (r.pulse > 0) { ctx.strokeStyle = rgba(col, r.pulse * 0.5); ctx.beginPath(); ctx.arc(r.x, r.y, 30 + (1 - r.pulse) * 24, 0, Math.PI * 2); ctx.stroke(); }
        E.text(r.name, r.x, r.y - 2, rgba(C.fg, 0.9), 11, 'center');
        E.text(r.up ? `${r.n} req` : 'health check failed', r.x, r.y + 12, rgba(r.up ? C.muted : C.bad, 0.9), 10, 'center');
      });
    },
  };
};
