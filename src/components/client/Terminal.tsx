'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { site } from '@/content/site';
import { onTerminalToggle } from './terminal-bus';

type Line = { text: string; kind?: 'cmd' | 'ok' | 'warn' };
const DOMAIN = new URL(site.url).hostname;
const ip = (d: string) => `203.0.113.${(d.length * 37) % 250 + 3}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Easter egg shell: press ` to open. Every command is simulated. */
export function Terminal() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([{ text: 'edge shell · type `help` to list commands', kind: 'ok' }]);
  const [value, setValue] = useState('');
  const hist = useRef<string[]>([]);
  const hi = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const out = useRef<HTMLDivElement>(null);

  const print = useCallback((text: string, kind?: Line['kind']) => setLines((l) => [...l, { text, kind }]), []);
  const printAll = useCallback(async (rows: string[]) => { for (const r of rows) { print(r); await sleep(35); } }, [print]);

  const toggle = useCallback((force?: boolean) => setOpen((o) => (force === undefined ? !o : force)), []);

  useEffect(() => onTerminalToggle(() => toggle()), [toggle]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as Element | null;
      if (e.key === '`' && !t?.closest('input, textarea')) { e.preventDefault(); toggle(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
  }, [open]);
  useEffect(() => { out.current?.scrollTo({ top: out.current.scrollHeight }); }, [lines]);

  const commands: Record<string, (args: string[]) => string[] | Promise<string[]>> = {
    help: () => ['commands:', '  whoami · about · experience · stack', '  dig <domain> · curl -I <url> · ping <host> · traceroute <host>', '  contact · resume · clear · exit'],
    whoami: () => [`${site.name} — ${site.jobTitle} @ ${site.employer}, ${site.location.city}`],
    about: () => ['I design the systems a company runs on: one platform, eight product families,', 'and a 5-person team that ships them with Scrum.'],
    experience: () => ['* a1f9e3c (HEAD -> main) present', '* 4e7b2d1 (tag: v3) Lead Developer — Mar 2025', '* 9c0d5a2 (tag: v2) Back-end Developer — Oct 2023', '* 2b8e6f0 (tag: v1) Freelance Software Developer — Aug 2022'],
    stack: () => [
      'architecture  onion/clean · CQRS + mediator · event-driven/observer · strategy · adapter · repository · facade · DTO',
      'systems       modular monolith · database-per-tenant · outbox + DLQ · worker queues · BFF · DDD · SOLID',
      'concurrency   multi-threaded async runtimes · lock-free maps · long-lived workers · background services · parallel I/O',
      'infra         DNS & edge security · gateway for 27 domains · traffic management · network segmentation · CI/CD',
      'languages     PHP/Laravel · TypeScript/NestJS · C#/.NET · Rust',
    ],
    contact: () => [`email   ${site.email}`, `github  ${site.github.replace('https://', '')}`],
    resume: () => { window.open('/resume.pdf', '_blank', 'noopener'); return ['opening resume.pdf …']; },
    sudo: () => [`${site.shortName.toLowerCase()} is not in the sudoers file. This incident will be reported.`],
    ls: () => ['about  experience  stack  contact  resume.pdf'],
    clear: () => { setLines([]); return []; },
    exit: () => { toggle(false); return []; },
    dig: (args) => {
      const d = (args[0] || DOMAIN).replace(/^https?:\/\//, '').replace(/\/.*/, '');
      return [`; <<>> DiG 9.18 <<>> ${d}`, ';; global options: +cmd', ';; Got answer:', `;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: ${1000 + Math.floor(Math.random() * 60000)}`,
        ';; flags: qr rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 1', '', ';; QUESTION SECTION:', `;${d}.\t\t\tIN\tA`, '', ';; ANSWER SECTION:',
        `${d}.\t300\tIN\tA\t${ip(d)}`, `${d}.\t300\tIN\tA\t${ip(d + 'x')}`, '', `;; Query time: ${12 + Math.floor(Math.random() * 30)} msec`, ';; SERVER: 1.1.1.1#53(1.1.1.1) (UDP)'];
    },
    curl: () => ['HTTP/2 200', 'server: edge', 'content-type: text/html; charset=utf-8', 'strict-transport-security: max-age=31536000; includeSubDomains',
      "content-security-policy: default-src 'self'; frame-ancestors 'none'", 'x-content-type-options: nosniff', 'referrer-policy: strict-origin-when-cross-origin',
      'cache-status: HIT', `x-instance: app-${1 + Math.floor(Math.random() * 3)}`],
    ping: async (args) => {
      const h = args[0] || DOMAIN; print(`PING ${h} (${ip(h)}): 56 data bytes`);
      const t: number[] = [];
      for (let i = 0; i < 4; i++) { await sleep(450); const ms = 8 + Math.random() * 9; t.push(ms); print(`64 bytes from ${ip(h)}: icmp_seq=${i} ttl=57 time=${ms.toFixed(3)} ms`); }
      return ['', `--- ${h} ping statistics ---`, '4 packets transmitted, 4 packets received, 0.0% packet loss',
        `round-trip min/avg/max = ${Math.min(...t).toFixed(3)}/${(t.reduce((a, b) => a + b) / 4).toFixed(3)}/${Math.max(...t).toFixed(3)} ms`];
    },
    traceroute: async (args) => {
      const h = args[0] || DOMAIN; print(`traceroute to ${h} (${ip(h)}), 30 hops max, 60 byte packets`);
      const hops = ['192.168.1.1', '10.40.0.1', '81.212.0.1', '212.156.0.9', '162.158.0.1 (edge network)', `${ip(h)} (gateway)`];
      let ms = 1;
      for (let i = 0; i < hops.length; i++) { await sleep(280); ms += 1 + Math.random() * 4; print(` ${i + 1}  ${hops[i]}  ${ms.toFixed(3)} ms  ${(ms + .3).toFixed(3)} ms  ${(ms + .6).toFixed(3)} ms`); }
      return [];
    },
  };

  const run = async (line: string) => {
    print(line, 'cmd');
    const [name, ...args] = line.trim().split(/\s+/);
    const fn = commands[name.toLowerCase()];
    if (!fn) { print(`command not found: ${name}. type 'help'.`, 'warn'); return; }
    const res = await fn(args);
    if (res.length) await printAll(res);
  };

  return (
    <div className="term" hidden={!open} role="dialog" aria-label="Terminal">
      <div className="bar"><i /><i /><i /><span>emin@edge — zsh</span><button type="button" onClick={() => toggle(false)} aria-label="Close terminal">esc ✕</button></div>
      <div className="out" ref={out} aria-live="polite">
        {lines.map((l, i) => <div key={i} className={l.kind}>{l.text}</div>)}
      </div>
      <form autoComplete="off" onSubmit={(e) => { e.preventDefault(); if (!value.trim()) return; hist.current.push(value); hi.current = hist.current.length; setValue(''); void run(value); }}>
        <label htmlFor="term-in">emin@edge:~$</label>
        <input id="term-in" ref={input} spellCheck={false} autoCapitalize="off" value={value} onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' && hi.current > 0) { e.preventDefault(); setValue(hist.current[--hi.current]); }
            if (e.key === 'ArrowDown') { e.preventDefault(); hi.current = Math.min(hist.current.length, hi.current + 1); setValue(hist.current[hi.current] ?? ''); }
            if (e.key === 'Escape') toggle(false);
          }} />
      </form>
    </div>
  );
}
