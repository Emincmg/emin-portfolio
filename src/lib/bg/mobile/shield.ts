import type { ModeFactory } from '../engine';

type Req = { x: number; y: number; vx: number; vy: number; st: 'in' | 'pass' | 'bounce'; t: number };
const CAP = 20, RATE = 8;

/** Shield: requests fly at the API; with a token they pass, without one they bounce off with 429. */
export const shield: ModeFactory = (E) => {
  const { C, rgba, ctx } = E;
  let tokens = CAP, reqs: Req[] = [], ok = 0, rej = 0, acc = 0, hit = 0;
  const center = () => ({ x: E.W / 2, y: E.H / 2 + 8 });
  const send = (x: number, y: number) => { const c = center(), d = Math.hypot(c.x - x, c.y - y) || 1; reqs.push({ x, y, vx: (c.x - x) / d * 150, vy: (c.y - y) / d * 150, st: 'in', t: 0 }); };
  const edgePoint = () => { const a = Math.random() * Math.PI * 2, c = center(), r = Math.max(E.W, E.H) * .6; return [c.x + Math.cos(a) * r, c.y + Math.sin(a) * r] as const; };
  return {
    label: 'Shield', hint: 'tap to fire a burst of requests',
    init() { tokens = CAP; reqs = []; ok = rej = 0; },
    click(x, y) { for (let i = 0; i < 22; i++) setTimeout(() => send(x + (Math.random() - .5) * 16, y + (Math.random() - .5) * 16), i * 30); },
    frame(dt) {
      tokens = Math.min(CAP, tokens + RATE * dt);
      acc += dt * 4; while (acc > 1) { acc--; const [x, y] = edgePoint(); send(x, y); }
      hit = Math.max(0, hit - dt * 3);
      const c = center(), R = Math.min(E.W, E.H) * .2;
      // token arc around the shield
      ctx.lineWidth = 6; ctx.strokeStyle = rgba(C.muted, .15); ctx.beginPath(); ctx.arc(c.x, c.y, R + 14, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = rgba(C.accent, .8); ctx.beginPath(); ctx.arc(c.x, c.y, R + 14, -Math.PI / 2, -Math.PI / 2 + (tokens / CAP) * Math.PI * 2); ctx.stroke(); ctx.lineWidth = 1;
      ctx.fillStyle = rgba(hit > 0 ? C.bad : C.accent, .12 + hit * .2); ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(hit > 0 ? C.bad : C.accent, .7); ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, Math.PI * 2); ctx.stroke();
      E.text('API', c.x, c.y + 4, rgba(C.fg, .9), 12, 'center');
      E.text(`${Math.floor(tokens)} tokens · ${RATE}/s`, c.x, c.y + R + 40, rgba(C.muted, .85), 10, 'center');
      E.text(`200 ${ok}`, 0, 14, rgba(C.accent, .9), 11);
      E.text(`429 ${rej}`, E.W, 14, rgba(C.bad, .9), 11, 'right');
      reqs = reqs.filter((r) => {
        r.t += dt;
        r.x += r.vx * dt; r.y += r.vy * dt;
        const d = Math.hypot(r.x - c.x, r.y - c.y);
        if (r.st === 'in' && d <= R + 2) {
          if (tokens >= 1) { tokens--; ok++; r.st = 'pass'; r.t = 0; }
          else { rej++; hit = 1; r.st = 'bounce'; r.t = 0; r.vx *= -1.2; r.vy *= -1.2; }
        }
        const col = r.st === 'bounce' ? C.bad : r.st === 'pass' ? C.accent : C.fg;
        const a = r.st === 'pass' ? Math.max(0, 1 - r.t * 4) : r.st === 'bounce' ? Math.max(0, 1 - r.t * 1.4) : .85;
        E.dot(r.x, r.y, 2.6, rgba(col, a));
        return a > 0 && r.t < 4;
      });
    },
  };
};
