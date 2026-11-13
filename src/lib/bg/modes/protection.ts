import type { ModeFactory } from '../engine';

type Req = { x: number; y: number; t: number; st: 'in' | 'pass' | 'rej' };

const CAP = 20, RATE = 10;

/** API protection: a token bucket rate limiter fed by the cursor; overflow gets 429. */
export const protection: ModeFactory = (E) => {
  const { C, rgba, ctx } = E;
  let tokens = CAP, reqs: Req[] = [], ok = 0, rej = 0, B = { x: 0, y: 0 }, lastMx = 0, lastMy = 0, acc = 0;
  const layout = () => { B = { x: E.W * .45, y: Math.max(200, E.H * .58) }; };
  const send = (x: number, y: number) => reqs.push({ x, y, t: 0, st: 'in' });
  return {
    label: 'API protection', hint: 'move to send requests · click for a burst',
    init() { layout(); tokens = CAP; reqs = []; ok = rej = 0; },
    resize: layout,
    click(x, y) { for (let i = 0; i < 18; i++) setTimeout(() => send(x + (Math.random() - .5) * 20, y + (Math.random() - .5) * 20), i * 25); },
    frame(dt, now) {
      const mo = E.mouse;
      tokens = Math.min(CAP, tokens + RATE * dt);
      const speed = Math.hypot(mo.x - lastMx, mo.y - lastMy) / Math.max(dt, .001); lastMx = mo.x; lastMy = mo.y;
      if (mo.x > -40 && mo.y > -40 && mo.x < E.W + 40 && mo.y < E.H + 40 && now - mo.last < 300) { acc += dt * Math.min(40, speed / 40); while (acc > 1) { acc--; send(mo.x, mo.y); } }
      else if (Math.random() < dt * 3) send(0, E.H * (.3 + Math.random() * .5));
      ['limit_req_zone $binary_remote_addr', `     zone=api:10m rate=${RATE}r/s;`, `limit_req zone=api burst=${CAP} nodelay;`].forEach((l, i) => E.text(l, B.x - 90, B.y - 150 + i * 16, rgba(C.muted, .75), 11));
      const bw = 90, bh = 120, bx = B.x - bw / 2, by = B.y - bh / 2;
      ctx.strokeStyle = rgba(C.accent, .6); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by); ctx.stroke();
      const n = Math.floor(tokens);
      for (let i = 0; i < n; i++) E.dot(bx + 12 + (i % 5) * 16.5, by + bh - 12 - Math.floor(i / 5) * 16, 5, rgba(C.accent, .75));
      E.text(`tokens ${n}/${CAP}`, B.x, by + bh + 22, rgba(C.fg, .85), 11, 'center');
      E.text(`200 OK ${ok}`, B.x + 120, B.y - 8, rgba(C.accent, .85), 11);
      E.text(`429 ${rej}`, B.x + 120, B.y + 10, rgba(C.bad, .85), 11);
      reqs = reqs.filter((r) => {
        r.t += dt;
        if (r.st === 'in') {
          const f = Math.min(1, r.t / .5);
          E.dot(E.lerp(r.x, bx - 8, f), E.lerp(r.y, B.y, f), 2.6, rgba(C.fg, .8));
          if (f >= 1) { if (tokens >= 1) { tokens--; ok++; r.st = 'pass'; } else { rej++; r.st = 'rej'; } r.t = 0; r.x = bx - 8; r.y = B.y; }
          return true;
        }
        if (r.st === 'pass') { const f = Math.min(1, r.t / .4); E.dot(E.lerp(bx + bw + 8, E.W + 10, f), B.y + 40, 2.6, rgba(C.accent, .9)); return f < 1; }
        const f = Math.min(1, r.t / .9); E.text('429', r.x - 10, r.y + f * 90, rgba(C.bad, 1 - f), 11, 'right'); return f < 1;
      });
      E.text('upstream →', bx + bw + 16, B.y + 56, rgba(C.muted, .7), 10);
    },
  };
};
