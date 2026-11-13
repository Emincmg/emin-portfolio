import type { ModeFactory } from '../engine';

type Job = { id: number; name: string; type: 'cpu' | 'io'; work: number; prog: number; born: number; start: number };

const N = 6;
const kinds: [string, 'cpu' | 'io'][] = [['resize-image', 'cpu'], ['send-mail', 'io'], ['sync-ledger', 'io'], ['render-pdf', 'cpu'], ['index-doc', 'cpu'], ['webhook', 'io'], ['transcode', 'cpu']];

/** Concurrency: a job queue drained by a worker pool; I/O-bound jobs park on await. */
export const concurrency: ModeFactory = (E) => {
  const { C, rgba, ctx } = E;
  let q: Job[] = [], workers: { job: Job | null }[] = [], done: string[] = [], id = 1, acc = 0, lat: number[] = [], tput = 0, tAcc = 0, tCount = 0;
  const job = (): Job => { const k = kinds[Math.floor(Math.random() * kinds.length)]; return { id: id++, name: k[0], type: k[1], work: .6 + Math.random() * 1.6, prog: 0, born: performance.now(), start: 0 }; };
  return {
    label: 'Concurrency', hint: 'click to enqueue a burst of jobs',
    init() { q = []; done = []; lat = []; workers = Array.from({ length: N }, () => ({ job: null })); for (let i = 0; i < 8; i++) q.push(job()); },
    click() { for (let i = 0; i < 24; i++) q.push(job()); },
    frame(dt, now) {
      const { W, H } = E;
      acc += dt * 3.2; while (acc > 1) { acc--; q.push(job()); }
      const qx = 12, qy = 46, qh = Math.min(H - 150, 16 * 14);
      E.text('job queue', qx, 18, rgba(C.muted, .85), 11);
      E.text(`depth ${q.length}`, qx, 32, rgba(q.length > 20 ? C.warm : C.fg, .8), 10);
      q.slice(0, Math.floor(qh / 16)).forEach((j, k) => {
        ctx.fillStyle = rgba(j.type === 'cpu' ? C.accent : C.warm, .55); ctx.fillRect(qx, qy + k * 16, 10, 10);
        E.text(`#${j.id} ${j.name}`, qx + 16, qy + k * 16 + 9, rgba(C.fg, .65), 10);
      });
      const lx = Math.min(170, W * .38), lw = W - lx - 14, lh = Math.min(34, (H - 150) / N);
      E.text(`worker pool · ${N} threads`, lx, 18, rgba(C.muted, .85), 11);
      workers.forEach((w, i) => {
        const y = 46 + i * lh, mid = y + (lh - 8) / 2 + 4;
        if (!w.job && q.length) { w.job = q.shift()!; w.job.start = now; }
        ctx.fillStyle = rgba(C.muted, .1); ctx.fillRect(lx, y, lw, lh - 8);
        E.text(`t${i}`, lx - 6, mid, rgba(C.muted, .7), 10, 'right');
        const j = w.job;
        if (!j) { E.text('idle', lx + 8, mid, rgba(C.muted, .5), 10); return; }
        // I/O jobs park on an await part of the time; CPU jobs burn the whole slice
        const waiting = j.type === 'io' && Math.sin(now / 180 + j.id) > .2;
        if (!waiting) j.prog += dt / j.work;
        const col = j.type === 'cpu' ? C.accent : C.warm;
        ctx.fillStyle = rgba(col, waiting ? .25 : .7); ctx.fillRect(lx, y, lw * Math.min(1, j.prog), lh - 8);
        if (waiting) { ctx.setLineDash([3, 3]); ctx.strokeStyle = rgba(col, .8); ctx.strokeRect(lx + .5, y + .5, lw - 1, lh - 9); ctx.setLineDash([]); }
        E.text(`${j.name}${waiting ? ' · await I/O' : ''}`, lx + 8, mid, rgba(C.fg, .9), 10);
        if (j.prog >= 1) { lat.push(now - j.born); lat = lat.slice(-200); done.unshift(`✓ #${j.id} ${j.name} ${((now - j.start) / 1000).toFixed(2)}s`); w.job = null; tCount++; }
      });
      tAcc += dt; if (tAcc >= 1) { tput = tCount / tAcc; tAcc = 0; tCount = 0; }
      const sorted = [...lat].sort((a, b) => a - b), p95 = sorted.length ? sorted[Math.floor(sorted.length * .95)] / 1000 : 0;
      const my = 46 + N * lh + 16;
      E.text(`${tput.toFixed(1)} jobs/s · p95 ${p95.toFixed(2)}s · busy ${workers.filter((w) => w.job).length}/${N}`, lx, my, rgba(C.accent, .9), 11);
      done = done.slice(0, Math.max(2, Math.floor((H - my - 20) / 15)));
      done.forEach((d, k) => E.text(d, lx, my + 20 + k * 15, rgba(C.fg, .6 - k * .06), 10));
      E.text('shared state: concurrent map (no global lock)', lx, H - 10, rgba(C.muted, .7), 10);
    },
  };
};
