import type { ModeFactory } from '../engine';

type Svc = { name: string; pts: number[]; st: 'up' | 'down' | 'boot'; t: number; phase: number };
const NAMES = ['gateway', 'cms-api', 'crm-api', 'pricing', 'worker'];

/** Heartbeat: each service draws an ECG-like health line; tap one to restart it. */
export const heartbeat: ModeFactory = (E) => {
  const { C, rgba, ctx } = E;
  let svcs: Svc[] = [], acc = 0;
  const rowH = () => (E.H - 20) / NAMES.length;
  return {
    label: 'Heartbeat', hint: 'tap a service to restart it',
    init() { svcs = NAMES.map((name, i) => ({ name, pts: Array(80).fill(0), st: 'up', t: 0, phase: i * 13 })); },
    click(_x, y) { const i = Math.floor((y - 10) / rowH()); const s = svcs[i]; if (s && s.st === 'up') { s.st = 'down'; s.t = 0; } },
    frame(dt) {
      acc += dt * 40;
      const steps = Math.floor(acc); acc -= steps;
      svcs.forEach((s) => {
        s.t += dt;
        if (s.st === 'down' && s.t > 1.2) { s.st = 'boot'; s.t = 0; }
        if (s.st === 'boot' && s.t > 1) { s.st = 'up'; s.t = 0; }
        for (let k = 0; k < steps; k++) {
          s.phase++;
          const beat = s.phase % 26;
          const v = s.st === 'down' ? 0 : s.st === 'boot' ? (Math.random() - .5) * 1.4 : beat === 0 ? -1 : beat === 1 ? .9 : beat === 2 ? -.3 : (Math.random() - .5) * .08;
          s.pts.push(v); s.pts.shift();
        }
      });
      const rh = rowH(), lx = 74, w = E.W - lx;
      svcs.forEach((s, i) => {
        const y = 10 + i * rh + rh / 2, col = s.st === 'up' ? C.accent : s.st === 'boot' ? C.warm : C.bad;
        E.dot(6, y, 3.5, rgba(col, .95));
        E.text(s.name, 16, y + 4, rgba(C.fg, .85), 11);
        E.text(s.st === 'up' ? 'healthy' : s.st === 'boot' ? 'starting' : 'restarting', 16, y + 17, rgba(col, .8), 9);
        ctx.strokeStyle = rgba(col, .85); ctx.lineWidth = 1.5; ctx.beginPath();
        s.pts.forEach((v, k) => { const x = lx + (k / (s.pts.length - 1)) * w, yy = y - v * rh * .38; if (k) ctx.lineTo(x, yy); else ctx.moveTo(x, yy); });
        ctx.stroke(); ctx.lineWidth = 1;
      });
    },
  };
};
