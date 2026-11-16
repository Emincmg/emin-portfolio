import type { ModeFactory } from '../engine';

type Msg = { col: number; y: number; v: number; poison: boolean; tries: number; st: 'fall' | 'up' | 'dlq'; t: number; x: number };

/** Event stream: messages fall down three partitions into consumers; poisoned ones retry, then land in the DLQ. */
export const stream: ModeFactory = (E) => {
  const { C, rgba, ctx } = E;
  let msgs: Msg[] = [], acc = 0, acks = 0, dlq = 0, cols: number[] = [], cw = 0, floor = 0, dlqX = 0;
  const layout = () => { cw = E.W * .16; cols = [.14, .38, .62].map((f) => E.W * f); floor = E.H - 46; dlqX = E.W * .86; };
  const spawn = () => { const col = Math.floor(Math.random() * 3); msgs.push({ col, y: 24, v: 70 + Math.random() * 50, poison: Math.random() < .05, tries: 0, st: 'fall', t: 0, x: cols[col] }); };
  return {
    label: 'Event stream', hint: 'tap a message to poison it',
    init() { layout(); msgs = []; acks = dlq = 0; },
    resize: layout,
    click(x, y) { const m = msgs.find((m) => m.st === 'fall' && Math.abs(m.x - x) < cw / 2 + 6 && Math.abs(m.y - y) < 18); if (m) m.poison = true; else for (let i = 0; i < 6; i++) setTimeout(spawn, i * 90); },
    frame(dt) {
      acc += dt * 2.4; while (acc > 1) { acc--; spawn(); }
      cols.forEach((x, i) => {
        ctx.strokeStyle = rgba(C.accent, .15); ctx.strokeRect(x - cw / 2, 20, cw, floor - 20);
        E.text(`p${i}`, x, 14, rgba(C.muted, .8), 10, 'center');
        ctx.strokeStyle = rgba(C.accent, .6); ctx.strokeRect(x - cw / 2, floor + 6, cw, 22);
        E.text(`worker`, x, floor + 21, rgba(C.fg, .8), 9, 'center');
      });
      ctx.strokeStyle = rgba(C.bad, .6); ctx.strokeRect(dlqX - 26, floor - 30, 52, 58);
      E.text('DLQ', dlqX, floor - 12, rgba(C.bad, .9), 10, 'center');
      E.text(String(dlq), dlqX, floor + 14, rgba(C.bad, .95), 14, 'center');
      msgs = msgs.filter((m) => {
        if (m.st === 'fall') {
          m.y += m.v * dt;
          if (m.y >= floor - 6) {
            if (m.poison || Math.random() < .03) { m.tries++; if (m.tries >= 3) { m.st = 'dlq'; m.t = 0; } else { m.st = 'up'; m.t = 0; } }
            else { acks++; return false; }
          }
        } else if (m.st === 'up') { m.t += dt; m.y -= 160 * dt; if (m.t > .35) m.st = 'fall'; }
        else { m.t += dt * 1.6; m.x = E.lerp(cols[m.col], dlqX, Math.min(1, m.t)); m.y = E.lerp(floor - 6, floor, Math.min(1, m.t)); if (m.t >= 1) { dlq++; return false; } }
        const col = m.st === 'dlq' || m.poison ? C.bad : m.tries ? C.warm : C.accent;
        ctx.fillStyle = rgba(col, .85); ctx.fillRect(m.x - cw / 2 + 4, m.y - 6, cw - 8, 12);
        if (m.tries && m.st !== 'dlq') E.text(`retry ${m.tries}`, m.x, m.y - 10, rgba(C.warm, .9), 9, 'center');
        return true;
      });
      E.text(`acked ${acks}`, E.W, 14, rgba(C.muted, .85), 10, 'right');
    },
  };
};
