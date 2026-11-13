import type { ModeFactory } from '../engine';

type Run = { n: number; repo: string; sha: string; stage: number; t: number; fail: number; done: boolean; ok: boolean | null };

const repos = ['portal-backend', 'crm-backend', 'pricing-engine', 'agency-web', 'guide-api', 'internal-erp', 'platform-infra', 'cms-backend'];
const stages = ['checkout', 'deps', 'lint', 'test', 'build', 'push', 'deploy'];
const logs: Record<string, string> = {
  checkout: 'actions/checkout@v4 · fetch-depth 1', deps: 'composer install --no-dev · npm ci', lint: 'pint --test · phpstan level 5',
  test: 'phpunit · 214 tests, 0 failures', build: 'docker buildx build --pull -t app:sha', push: 'push ghcr.io/…:sha · 3 layers', deploy: 'runner: docker compose pull && up -d --no-deps',
};

/** Continuous delivery: workflow runs fill their stages; tests occasionally fail and re-run. */
export const delivery: ModeFactory = (E) => {
  const { C, rgba, ctx } = E;
  let runs: Run[] = [], log: string[] = [], nextRun = 0, num = 1280;
  const hex = () => Math.random().toString(16).slice(2, 9);
  const add = (repo?: string) => {
    runs.unshift({ n: ++num, repo: repo || repos[Math.floor(Math.random() * repos.length)], sha: hex(), stage: 0, t: 0, fail: Math.random() < .12 ? 3 : -1, done: false, ok: null });
    runs = runs.slice(0, Math.max(3, Math.min(9, Math.floor((E.H - 260) / 28))));
  };
  return {
    label: 'Continuous delivery', hint: 'click to dispatch a new run',
    init() { runs = []; log = []; for (let i = 0; i < 4; i++) { add(); runs[0].stage = 7; runs[0].done = true; runs[0].ok = true; } add(); nextRun = performance.now() + 3000; },
    click() { add(); log.push(`workflow_dispatch → #${num}`); },
    frame(dt, now) {
      const narrow = E.W < 640;
      if (now > nextRun) { add(); nextRun = now + 3500 + Math.random() * 2500; }
      const x0 = 12, rowH = 28, y0 = 70, nameW = narrow ? 178 : 270, bw = Math.max(14, Math.min(54, (E.W - x0 - nameW - 28 - 12) / 7));
      E.text('Actions · all workflows', x0, 18, rgba(C.muted, .85), 11);
      runs.forEach((r, i) => {
        if (!r.done) {
          r.t += dt;
          if (r.t > .9) {
            r.t = 0; log.push(`[#${r.n}] ${stages[r.stage]}: ${logs[stages[r.stage]]}`);
            if (r.stage === r.fail) { r.done = true; r.ok = false; log.push(`[#${r.n}] ✗ test failed · re-running`); setTimeout(() => add(r.repo), 1200); }
            else if (++r.stage >= stages.length) { r.done = true; r.ok = true; log.push(`[#${r.n}] ✓ deployed ${r.repo}`); }
          }
        }
        const y = y0 + i * rowH, al = 1 - i * .07;
        E.text(r.done ? (r.ok ? '✓' : '✗') : '●', x0, y, rgba(r.done ? (r.ok ? C.accent : C.bad) : C.warm, al), 12);
        E.text(`#${r.n} ${r.repo}`.slice(0, narrow ? 24 : 34), x0 + 16, y, rgba(C.fg, .8 * al), 10.5);
        if (!narrow) E.text(r.sha, x0 + 210, y, rgba(C.muted, .7 * al), 10);
        stages.forEach((s, k) => {
          const bx = x0 + nameW + k * (bw + 4);
          const state = k < r.stage ? 'ok' : k === r.stage && !r.done ? 'run' : k === r.stage && r.ok === false ? 'bad' : 'wait';
          const col = state === 'ok' ? C.accent : state === 'run' ? C.warm : state === 'bad' ? C.bad : C.muted;
          const fill = state === 'run' ? r.t / .9 : state === 'wait' ? 0 : 1;
          ctx.fillStyle = rgba(C.muted, .15 * al); ctx.fillRect(bx, y - 10, bw, 11);
          ctx.fillStyle = rgba(col, .7 * al); ctx.fillRect(bx, y - 10, bw * fill, 11);
          if (i === 0 && bw >= 30) E.text(s, bx, y0 - 24, rgba(C.muted, .7), 9);
        });
      });
      log = log.slice(-10);
      const ly = y0 + runs.length * rowH + 30;
      log.slice(-Math.max(2, Math.floor((E.H - ly) / 16))).forEach((l, i, arr) =>
        E.text(l, x0, ly + i * 16, rgba(l.includes('✗') ? C.bad : l.includes('✓') ? C.accent : C.fg, .3 + .65 * i / arr.length), 10.5));
    },
  };
};
