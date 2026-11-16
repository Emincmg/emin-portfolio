import type { ModeFactory } from '../engine';

type Run = { n: number; stage: number; t: number; fail: number; state: 'run' | 'ok' | 'bad'; age: number };
const STAGES = ['checkout', 'deps', 'lint', 'test', 'build', 'push', 'deploy'];

/** Deploy ring: each run is a ring of seven stages lighting up in turn; up to three run at once. */
export const ring: ModeFactory = (E) => {
  const { C, rgba, ctx } = E;
  let runs: Run[] = [], num = 1280, deployed = 0, next = 0;
  const add = () => { runs.unshift({ n: ++num, stage: 0, t: 0, fail: Math.random() < .15 ? 3 : -1, state: 'run', age: 0 }); runs = runs.slice(0, 3); };
  return {
    label: 'Deploy ring', hint: 'tap to dispatch a run',
    init() { runs = []; add(); next = performance.now() + 2500; },
    click() { add(); },
    frame(dt, now) {
      if (now > next) { add(); next = now + 3200 + Math.random() * 1500; }
      const cx = E.W / 2, cy = E.H / 2 + 6, R = Math.min(E.W, E.H) * .4;
      runs.forEach((r, k) => {
        if (r.state === 'run') {
          r.t += dt;
          if (r.t > .55) { r.t = 0; if (r.stage === r.fail) { r.state = 'bad'; setTimeout(add, 900); } else if (++r.stage >= STAGES.length) { r.state = 'ok'; deployed++; } }
        } else r.age += dt;
        const rad = R - k * 22, seg = (Math.PI * 2) / STAGES.length;
        STAGES.forEach((_, i) => {
          const a0 = -Math.PI / 2 + i * seg + .04, a1 = a0 + seg - .08;
          const st = i < r.stage ? 'ok' : i === r.stage && r.state === 'run' ? 'run' : i === r.stage && r.state === 'bad' ? 'bad' : 'wait';
          const col = st === 'ok' ? C.accent : st === 'run' ? C.warm : st === 'bad' ? C.bad : C.muted;
          ctx.strokeStyle = rgba(col, st === 'wait' ? .15 : (.85 - k * .2)); ctx.lineWidth = k ? 6 : 10;
          ctx.beginPath(); ctx.arc(cx, cy, rad, a0, st === 'run' ? a0 + (a1 - a0) * (r.t / .55) : a1); ctx.stroke();
          if (st === 'run') { ctx.strokeStyle = rgba(C.muted, .15); ctx.beginPath(); ctx.arc(cx, cy, rad, a0, a1); ctx.stroke(); }
        });
      });
      ctx.lineWidth = 1;
      const r0 = runs[0];
      if (r0) {
        E.text(`#${r0.n}`, cx, cy - 8, rgba(C.fg, .95), 16, 'center');
        const label = r0.state === 'ok' ? '✓ deployed' : r0.state === 'bad' ? '✗ test failed' : STAGES[Math.min(r0.stage, 6)];
        E.text(label, cx, cy + 12, rgba(r0.state === 'bad' ? C.bad : r0.state === 'ok' ? C.accent : C.warm, .95), 11, 'center');
      }
      E.text(`${deployed} deploys`, cx, cy + 30, rgba(C.muted, .85), 10, 'center');
    },
  };
};
