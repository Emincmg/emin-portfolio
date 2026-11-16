import type { ModeFactory } from '../engine';

type Job = { type: 'cpu' | 'io'; work: number; prog: number; id: number };
const N = 6;

/** Worker lanes: six threads fill like an equalizer; I/O-bound work pulses while it awaits. */
export const lanes: ModeFactory = (E) => {
  const { C, rgba, ctx } = E;
  let q: Job[] = [], w: (Job | null)[] = [], acc = 0, id = 1, doneCount = 0, tput = 0, tAcc = 0;
  const job = (): Job => ({ type: Math.random() < .45 ? 'io' : 'cpu', work: .5 + Math.random() * 1.4, prog: 0, id: id++ });
  return {
    label: 'Worker lanes', hint: 'tap to enqueue a burst of jobs',
    init() { q = []; w = Array(N).fill(null); },
    click() { for (let i = 0; i < 20; i++) q.push(job()); },
    frame(dt, now) {
      acc += dt * 3; while (acc > 1) { acc--; q.push(job()); }
      const top = 44, bottom = E.H - 30, lw = (E.W - 20) / N;
      // queue as a stack of chips
      E.text(`queue ${q.length}`, 0, 14, rgba(q.length > 20 ? C.warm : C.muted, .9), 11);
      for (let i = 0; i < Math.min(q.length, 30); i++) { ctx.fillStyle = rgba(q[i].type === 'cpu' ? C.accent : C.warm, .6); ctx.fillRect(84 + i * 8, 6, 6, 10); }
      w.forEach((j, i) => {
        const x = 10 + i * lw + 6, bw = lw - 12;
        if (!j && q.length) { w[i] = j = q.shift()!; }
        ctx.fillStyle = rgba(C.muted, .1); ctx.fillRect(x, top, bw, bottom - top);
        E.text(`t${i}`, x + bw / 2, bottom + 16, rgba(C.muted, .8), 10, 'center');
        if (!j) return;
        const waiting = j.type === 'io' && Math.sin(now / 160 + j.id) > .25;
        if (!waiting) j.prog += dt / j.work;
        const h = (bottom - top) * Math.min(1, j.prog), col = j.type === 'cpu' ? C.accent : C.warm;
        ctx.fillStyle = rgba(col, waiting ? .3 + .2 * Math.sin(now / 90) : .8); ctx.fillRect(x, bottom - h, bw, h);
        if (j.prog >= 1) { w[i] = null; doneCount++; }
      });
      tAcc += dt; if (tAcc >= 1) { tput = doneCount / tAcc; tAcc = 0; doneCount = 0; }
      E.text(`${tput.toFixed(1)} jobs/s`, E.W, 14, rgba(C.accent, .9), 11, 'right');
      E.text('cpu', 0, 32, rgba(C.accent, .8), 10); E.text('await I/O', 34, 32, rgba(C.warm, .8), 10);
    },
  };
};
