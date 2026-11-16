'use client';

import { useEffect } from 'react';
import { site } from '@/content/site';

const ART = `
██╗    ██╗██╗  ██╗ █████╗ ████████╗   █████╗ ██████╗ ███████╗
██║    ██║██║  ██║██╔══██╗╚══██╔══╝  ██╔══██╗██╔══██╗██╔════╝
██║ █╗ ██║███████║███████║   ██║     ███████║██████╔╝█████╗  
██║███╗██║██╔══██║██╔══██║   ██║     ██╔══██║██╔══██╗██╔══╝  
╚███╔███╔╝██║  ██║██║  ██║   ██║     ██║  ██║██║  ██║███████╗
 ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝

██╗   ██╗ ██████╗ ██╗   ██╗  ██████╗  ██████╗ ██╗███╗   ██╗ ██████╗ 
╚██╗ ██╔╝██╔═══██╗██║   ██║  ██╔══██╗██╔═══██╗██║████╗  ██║██╔════╝ 
 ╚████╔╝ ██║   ██║██║   ██║  ██║  ██║██║   ██║██║██╔██╗ ██║██║  ███╗
  ╚██╔╝  ██║   ██║██║   ██║  ██║  ██║██║   ██║██║██║╚██╗██║██║   ██║
   ██║   ╚██████╔╝╚██████╔╝  ██████╔╝╚██████╔╝██║██║ ╚████║╚██████╔╝
   ╚═╝    ╚═════╝  ╚═════╝   ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝ ╚═════╝ 

██╗  ██╗███████╗██████╗ ███████╗██████╗ 
██║  ██║██╔════╝██╔══██╗██╔════╝╚════██╗
███████║█████╗  ██████╔╝█████╗    ▄███╔╝
██╔══██║██╔══╝  ██╔══██╗██╔══╝    ▀▀══╝ 
██║  ██║███████╗██║  ██║███████╗  ██╗   
╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝  ╚═╝   
`;

/** A note for whoever opens the browser console. */
export function ConsoleEgg() {
  useEffect(() => {
    const w = window as unknown as { __consoleEgg?: boolean };
    if (w.__consoleEgg) return; // once per page, even with React's dev double-run
    w.__consoleEgg = true;
    const mono = 'font-family: ui-monospace, Menlo, monospace;';
    console.log(`%c${ART}`, `${mono} color: #00e5ff; font-size: 11px; line-height: 1.1; text-shadow: 0 0 6px rgba(0, 229, 255, .6);`);
    console.log("%c> aren't you a curious one...", `${mono} color: #ff2bd6; font-size: 16px; font-weight: bold; text-shadow: 0 0 8px rgba(255, 43, 214, .6);`);
    console.log(
      `%cReading the console means we'd probably get along.\nI build multi-tenant systems, queues and edge infrastructure.\n\n  mail    ${site.email}\n  github  ${site.github}\n\nPress \` on the page for a shell.`,
      `${mono} color: #bdb8da; font-size: 12px; line-height: 1.6;`,
    );
  }, []);
  return null;
}
