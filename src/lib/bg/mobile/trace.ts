import type { ModeFactory } from '../engine';

const PHASES = [['DNS', 'accent'], ['TCP', 'accent'], ['TLS', 'accent'], ['TTFB', 'warm'], ['Download', 'fg'], ['Render', 'muted']] as const;

/** Request trace: one request's timing waterfall, like the browser's network panel. */
export const trace: ModeFactory = (E) => {
  const { C, rgba, ctx } = E;
  let ms: number[] = [], t = 0, done = 0, history: number[] = [], cached = false;
  const next = () => {
    cached = Math.random() < 0.3;
    ms = cached ? [0, 0, 0, 18 + Math.random() * 20, 6 + Math.random() * 10, 30 + Math.random() * 30]
      : [8 + Math.random() * 30, 10 + Math.random() * 25, 15 + Math.random() * 30, 40 + Math.random() * 120, 20 + Math.random() * 60, 40 + Math.random() * 60];
    t = 0; done = 0;
  };
  return {
    label: 'Request trace', hint: 'tap to send a new request',
    init() { history = []; next(); },
    click() { next(); },
    frame(dt) {
      const total = ms.reduce((a, b) => a + b, 0);
      t += dt * 260; // ms of request time per second of animation
      const x0 = 74, x1 = E.W - 12, rowH = Math.min(30, (E.H - 110) / PHASES.length), y0 = 40;
      const scale = (x1 - x0) / Math.max(total, 1);
      E.text(cached ? 'GET / · cache hit' : 'GET / · cold start', 0, 18, rgba(C.muted, .9), 11);
      let start = 0;
      PHASES.forEach(([name, col], i) => {
        const y = y0 + i * rowH, d = ms[i], shown = Math.max(0, Math.min(d, t - start));
        E.text(name, 0, y + rowH / 2 + 4, rgba(d ? C.fg : C.muted, d ? .85 : .4), 11);
        ctx.fillStyle = rgba(C.muted, .1); ctx.fillRect(x0, y + 4, x1 - x0, rowH - 10);
        ctx.fillStyle = rgba(C[col], .8); ctx.fillRect(x0 + start * scale, y + 4, shown * scale, rowH - 10);
        if (shown >= d && d > 0) E.text(`${d.toFixed(0)}ms`, Math.min(x1 - 34, x0 + (start + d) * scale + 4), y + rowH / 2 + 4, rgba(C.muted, .8), 10);
        start += d;
      });
      if (t >= total && !done) { done = t; history.push(total); history = history.slice(-24); }
      const by = y0 + PHASES.length * rowH + 22;
      E.text(`total ${Math.min(t, total).toFixed(0)} ms`, 0, by, rgba(C.accent, .95), 13);
      // sparkline of previous requests
      const sx = E.W - 130, sw = 118, sh = 28, max = Math.max(...history, 1);
      ctx.strokeStyle = rgba(C.accent, .7); ctx.beginPath();
      history.forEach((v, i) => { const x = sx + (i / 23) * sw, y = by + 4 - (v / max) * sh; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      ctx.stroke();
      if (done && t > done + 320) next();
    },
  };
};
