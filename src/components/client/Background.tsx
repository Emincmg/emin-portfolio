'use client';

import { useEffect, useRef, useState } from 'react';
import { BackgroundController, setBackground } from '@/lib/bg/engine';
import { MODES } from '@/lib/bg/modes';
import { openTerminal } from './terminal-bus';

/** Fixed canvas + mode switcher. Which section is active is decided in Motion. */
export function Background() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ctl, setCtl] = useState<BackgroundController | null>(null);
  const [state, setState] = useState({ mode: 'packets', auto: true });

  useEffect(() => {
    if (!canvas.current) return;
    const c = new BackgroundController(canvas.current, MODES);
    setBackground(c);
    const stage = document.querySelector<HTMLElement>('.bgstage');
    c.section(stage?.dataset.bg ?? 'packets', stage);
    const m = location.hash.match(/^#bg-([a-z]+)$/);
    if (m) c.set(m[1]);
    const off = c.subscribe(setState);
    setCtl(c);
    return () => { off(); c.destroy(); setBackground(null); };
  }, []);

  return (
    <>
      <canvas id="bg" ref={canvas} aria-hidden="true" />
      <div className="bgctl" role="toolbar" aria-label="Background">
        <button type="button" aria-pressed={state.auto} onClick={() => ctl?.setAuto(true)}>Auto</button>
        <span className="sep" />
        {ctl && Object.entries(ctl.modes).map(([key, m]) => (
          <button key={key} type="button" aria-pressed={!state.auto && state.mode === key} className={state.auto && state.mode === key ? 'live' : undefined} onClick={() => ctl.set(key)}>
            {m.label}
          </button>
        ))}
        <span className="sep" />
        <button type="button" onClick={openTerminal}>&gt;_ terminal</button>
      </div>
    </>
  );
}
