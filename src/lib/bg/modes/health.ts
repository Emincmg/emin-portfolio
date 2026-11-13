import type { ModeFactory } from '../engine';

type Box = { n: string; cpu: number; mem: number; lim: number; hist: number[]; st: 'healthy' | 'restarting' | 'starting'; t: number; up: number };

const names = ['gateway', 'portal-api', 'portal-msg', 'portal-web', 'crm-api', 'crm-web-1', 'crm-web-2', 'pricing', 'guide-api', 'agency-web', 'erp', 'cms-api', 'scheduling', 'cache', 'docstore', 'sql', 'worker', 'uptime'];

/** Service health: live container stats; click one to restart it. */
export const health: ModeFactory = (E) => {
  const { C, rgba, ctx } = E;
  let cs: Box[] = [], cols = 1, tw = 0, shown = 0;
  const th = 70, oy = 34;
  const layout = () => {
    cols = Math.max(1, Math.floor((E.W + 10) / 160)); tw = (E.W - (cols - 1) * 10) / cols;
    shown = Math.min(names.length, Math.max(1, Math.floor((E.H - oy) / (th + 10))) * cols);
  };
  const pos = (i: number) => ({ x: (i % cols) * (tw + 10), y: oy + Math.floor(i / cols) * (th + 10) });
  return {
    label: 'Service health', hint: 'click a container to restart it',
    init() { layout(); cs = names.map((n, i) => ({ n, cpu: Math.random() * 20, mem: 80 + Math.random() * 400, lim: [512, 1024, 2048][i % 3], hist: Array(24).fill(0), st: 'healthy', t: 0, up: 2 + Math.floor(Math.random() * 40) })); },
    resize: layout,
    click(x, y) { cs.forEach((c, i) => { if (i >= shown) return; const p = pos(i); if (x > p.x && x < p.x + tw && y > p.y && y < p.y + th) { c.st = 'restarting'; c.t = 0; } }); },
    frame(dt, now) {
      const mo = E.mouse;
      E.text(`$ docker stats · ${names.length} containers`, 0, 16, rgba(C.muted, .85), 11);
      cs.forEach((c, i) => {
        if (i >= shown) return;
        c.t += dt;
        if (c.st === 'restarting' && c.t > 1.2) { c.st = 'starting'; c.t = 0; c.up = 0; }
        if (c.st === 'starting' && c.t > 1.4) { c.st = 'healthy'; c.t = 0; }
        const target = c.st === 'restarting' ? 0 : c.st === 'starting' ? 70 : 4 + Math.random() * 18 + (Math.sin(now / 900 + i) + 1) * 6;
        c.cpu += (target - c.cpu) * .08;
        if (Math.random() < dt * 4) { c.hist.push(c.cpu); c.hist.shift(); }
        const { x, y } = pos(i);
        const hover = mo.x > x && mo.x < x + tw && mo.y > y && mo.y < y + th, al = hover ? 1 : .75;
        const sc = c.st === 'healthy' ? C.accent : c.st === 'starting' ? C.warm : C.bad;
        ctx.fillStyle = rgba(C.fg, hover ? .05 : .025); ctx.fillRect(x, y, tw, th);
        ctx.strokeStyle = rgba(sc, hover ? .7 : .25); ctx.strokeRect(x + .5, y + .5, tw - 1, th - 1);
        E.dot(x + 12, y + 15, 3.5, rgba(sc, al));
        E.text(c.n, x + 22, y + 19, rgba(C.fg, al), 11);
        E.text(c.st === 'healthy' ? `Up ${c.up}d (healthy)` : c.st, x + 12, y + 36, rgba(sc, .8 * al), 10);
        E.text(`CPU ${c.cpu.toFixed(1)}%`, x + 12, y + 52, rgba(C.muted, al), 10);
        E.text(`MEM ${Math.round(c.mem)}M/${c.lim}M`, x + 12, y + 66, rgba(C.muted, al), 10);
        if (tw < 170) return;
        ctx.strokeStyle = rgba(C.accent, .6 * al); ctx.beginPath();
        c.hist.forEach((v, k) => { const px = x + tw - 74 + k * 3, py = y + th - 10 - Math.min(40, v * .5); if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
        ctx.stroke();
      });
    },
  };
};
