'use client';

import { useEffect, useState } from 'react';
import { BackgroundController, setBackground } from '@/lib/bg/engine';
import { MODES } from '@/lib/bg/modes';
import { MOBILE_MODES } from '@/lib/bg/mobile';

const NARROW = '(max-width: 899px)';

/** Creates the background engine. Narrow screens get the touch-first mode set; Motion decides which section is active. */
export function Background() {
  const [narrow, setNarrow] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = matchMedia(NARROW);
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (narrow === null) return;
    const c = new BackgroundController(document.createElement('canvas'), narrow ? MOBILE_MODES : MODES);
    setBackground(c);
    const stage = document.querySelector<HTMLElement>('.bgstage');
    c.section(stage?.dataset.bg ?? 'packets', stage);
    // let Motion pick the stage of the section currently in view
    window.dispatchEvent(new Event('scroll'));
    return () => { c.destroy(); setBackground(null); };
  }, [narrow]);

  return null;
}
